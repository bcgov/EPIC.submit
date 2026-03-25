# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Geospatial service layer.

Handles all geospatial business logic including:
- Converting and tiering raw .shp/.zip files into GeoJSON
- Orchestrating background S3 download/upload workflows
- Providing presigned read URLs for processed files
"""
from __future__ import annotations

import json
import logging
import os
import tempfile
import threading
from typing import Any, Dict
import tempfile
import zipfile
import glob
import pandas as pd

import geopandas as gpd

from submit_api.models import GeoDataUpload, db
from submit_api.services.document_service_client import DocumentServiceClient


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Raw GeoJSON conversion helpers
# ---------------------------------------------------------------------------

def _is_json_serializable(val: Any) -> bool:
    """Return True if val can be serialised to JSON."""
    try:
        json.dumps(val)
        return True
    except (TypeError, OverflowError):
        return False


def _generate_tier(
    df: gpd.GeoDataFrame, simplification: float, max_features: int | None = None
) -> bytes:
    """Simplify and down-sample a GeoDataFrame, returning UTF-8 GeoJSON bytes."""
    work_df = df.copy()
    if max_features and len(work_df) > max_features:
        work_df = work_df.sample(n=max_features, random_state=42)

    # Only simplify if a non-zero factor is provided
    if simplification and simplification > 0:
        work_df.geometry = work_df.geometry.simplify(simplification, preserve_topology=True)

    return work_df.to_json().encode("utf-8")


def process_geo_file(local_path: str) -> Dict[str, Any]:
    """Process a geospatial file into preview/standard tiers plus metadata.

    Args:
        local_path: Local filesystem path to a .shp or .zip file.

    Returns:
        dict with keys ``tiers`` (dict of bytes keyed by tier name) and
        ``metadata`` (feature_count, geometry_type, crs_original, bbox).
    """
    # Determine if we should favor the fiona engine (better for some zips)
    is_zip = local_path.lower().endswith(".zip")
    is_shp = local_path.lower().endswith(".shp")
    read_engine = "fiona" if is_zip else None

    # SHAPE_RESTORE_SHX tells GDAL to reconstruct the missing .shx index
    # when only a bare .shp file was uploaded without companion sidecar files.
    _prev = os.environ.get("SHAPE_RESTORE_SHX")
    if is_shp:
        os.environ["SHAPE_RESTORE_SHX"] = "YES"
        
    try:
        color_palette = [
            ("#FF00FF", "#8B008B"),  # Neon Magenta
            ("#00FFFF", "#008B8B"),  # Neon Cyan
            ("#FF1493", "#C71585"),  # Deep Pink
            ("#39FF14", "#008000"),  # Neon Green
            ("#FF4500", "#B22222"),  # Orange Red
            ("#9400D3", "#4B0082"),  # Dark Violet
            ("#FFFF00", "#B8860B"),  # Bright Yellow
            ("#FF007F", "#80003F"),  # Rose
            ("#00FF00", "#006400"),  # Lime
            ("#8A2BE2", "#483D8B"),  # Blue Violet
        ]
        
        if is_zip:
            with tempfile.TemporaryDirectory() as temp_dir:
                with zipfile.ZipFile(local_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Recursively find all .shp files
                shp_files = glob.glob(os.path.join(temp_dir, "**", "*.shp"), recursive=True)
                
                if not shp_files:
                    raise ValueError("No .shp files found inside the zip archive.")
                    
                gdfs = []
                # Sort to ensure consistent coloring order
                shp_files.sort()
                for i, shp_file in enumerate(shp_files):
                    try:
                        g = gpd.read_file(shp_file)
                        
                        # Assign distinct color per feature rather than per layer
                        fill_colors, stroke_colors = [], []
                        for idx in range(len(g)):
                            f_col, s_col = color_palette[(idx + i) % len(color_palette)]
                            fill_colors.append(f_col)
                            stroke_colors.append(s_col)
                            
                        g["layer_color"] = fill_colors
                        g["stroke_color"] = stroke_colors
                        g["layer_name"] = os.path.basename(shp_file)
                        gdfs.append(g)
                    except Exception as e:
                        logger.warning(f"Failed to read shapefile {shp_file}: {e}")
                        
                if not gdfs:
                    raise ValueError("Failed to read any geospatial layers from the zip file.")
                    
                if len(gdfs) == 1:
                    gdf = gdfs[0]
                else:
                    base_crs = gdfs[0].crs
                    aligned_gdfs = []
                    for g in gdfs:
                        if g.crs != base_crs and base_crs is not None and g.crs is not None:
                            aligned_gdfs.append(g.to_crs(base_crs))
                        else:
                            aligned_gdfs.append(g)
                    gdf = gpd.GeoDataFrame(pd.concat(aligned_gdfs, ignore_index=True), crs=base_crs)
        else:
            gdf = gpd.read_file(local_path)
            fill_colors, stroke_colors = [], []
            for idx in range(len(gdf)):
                f_col, s_col = color_palette[idx % len(color_palette)]
                fill_colors.append(f_col)
                stroke_colors.append(s_col)
                
            gdf["layer_color"] = fill_colors
            gdf["stroke_color"] = stroke_colors
            gdf["layer_name"] = os.path.basename(local_path)
    finally:
        if is_shp:
            if _prev is None:
                os.environ.pop("SHAPE_RESTORE_SHX", None)
            else:
                os.environ["SHAPE_RESTORE_SHX"] = _prev
    crs_original = str(gdf.crs.to_string()) if gdf.crs else "Unknown"

    # Drop null / empty geometries
    original_count = len(gdf)
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty]
    logger.info("Dropped %d null or empty geometries", original_count - len(gdf))

    # Reproject to WGS-84 if required
    if gdf.crs is None:
        # Missing .prj sidecar — no source projection info available.
        # Assume WGS-84 (the most common default for geographic data).
        logger.warning("No CRS found in file (missing .prj?). Assuming EPSG:4326.")
        gdf = gdf.set_crs("EPSG:4326")
    elif not gdf.crs.equals("EPSG:4326"):
        logger.info("Reprojecting from %s to EPSG:4326", gdf.crs)
        gdf = gdf.to_crs("EPSG:4326")

    feature_count = len(gdf)
    geometry_type = gdf.geom_type.mode().iloc[0] if not gdf.empty else "Unknown"
    bbox = [float(x) for x in gdf.total_bounds] if not gdf.empty else [0.0, 0.0, 0.0, 0.0]

    # Drop columns that cannot be serialised to JSON (dates, bytes, etc.)
    cols_to_drop = []
    if not gdf.empty:
        for col in gdf.columns:
            if col == "geometry":
                continue
            sample = gdf[col].dropna().iloc[0] if not gdf[col].dropna().empty else None
            if sample is not None and not _is_json_serializable(sample):
                cols_to_drop.append(col)
    if cols_to_drop:
        logger.info("Dropping non-serialisable columns: %s", cols_to_drop)
        gdf = gdf.drop(columns=cols_to_drop)

    logger.info("Generating tiers…")
    return {
        "tiers": {
            # 0.000001 degrees is ~11cm precision (plenty for map preview)
            "preview": _generate_tier(gdf, 0.000001, 10_000),
            # 0 means no simplification at all
            "standard": _generate_tier(gdf, 0),
        },
        "metadata": {
            "feature_count": feature_count,
            "geometry_type": str(geometry_type),
            "crs_original": crs_original,
            "bbox": bbox,
        },
    }


# ---------------------------------------------------------------------------
# GeoService — orchestration layer consumed by the API resources
# ---------------------------------------------------------------------------

# Max number of concurrent geospatial processing jobs to prevent resource exhaustion (RAM/CPU/DB)
GEO_MAX_CONCURRENT_JOBS = int(os.environ.get("GEO_MAX_CONCURRENT_JOBS", 3))
_GEO_SEMAPHORE = threading.Semaphore(GEO_MAX_CONCURRENT_JOBS)


class GeoService:
    """Service class for geospatial upload management."""

    # -- Background worker ---------------------------------------------------

    @staticmethod
    def _process_upload_in_background(app, upload_id: int) -> None:
        """Download, convert, and re-upload a single GeoDataUpload (runs in daemon thread)."""
        with _GEO_SEMAPHORE:
            with app.app_context():
                upload = db.session.get(GeoDataUpload, upload_id)
                if not upload:
                    logger.error("GeoDataUpload %s not found.", upload_id)
                    return

                try:
                    read_url = DocumentServiceClient.get_presigned_read_url(upload.raw_s3_key)

                    with tempfile.TemporaryDirectory() as tmpdir:
                        local_path = os.path.join(tmpdir, os.path.basename(upload.raw_s3_key))
                        DocumentServiceClient.download_via_presigned_url(read_url, local_path)

                        result = process_geo_file(local_path)

                        for tier in ("preview", "standard"):
                            s3_key = f"geo/processed/{upload_id}/{tier}.geojson"
                            write_url, actual_s3_key = DocumentServiceClient.get_presigned_write_url(s3_key)
                            DocumentServiceClient.upload_via_presigned_url(write_url, result["tiers"][tier])
                            if tier == "preview":
                                upload.preview_s3_key = actual_s3_key
                            else:
                                upload.standard_s3_key = actual_s3_key

                    metadata = result["metadata"]
                    upload.feature_count = metadata["feature_count"]
                    upload.geometry_type = metadata["geometry_type"]
                    upload.crs_original = metadata["crs_original"]
                    upload.bbox = metadata["bbox"]
                    upload.status = "ready"
                    db.session.commit()
                    logger.info("Successfully processed GeoDataUpload %s", upload_id)

                except Exception as exc:  # pylint: disable=broad-except
                    logger.exception("Error processing GeoDataUpload %s: %s", upload_id, exc)
                    upload.status = "failed"
                    upload.error_message = str(exc)
                    db.session.commit()

    @classmethod
    def _spawn_processing_thread(cls, app, upload_id: int) -> None:
        """Spawn a daemon thread to process the given upload."""
        thread = threading.Thread(
            target=cls._process_upload_in_background,
            args=(app, upload_id),
        )
        thread.daemon = True
        thread.start()

    # -- CRUD ----------------------------------------------------------------

    @classmethod
    def create_upload(cls, app, filename: str, file_type: str, file_size_mb: float, s3_key: str) -> GeoDataUpload:
        """Create a GeoDataUpload record and kick off background processing."""
        if file_type not in ("shp", "zip"):
            raise ValueError("file_type must be 'shp' or 'zip'")

        upload = GeoDataUpload(
            filename=filename,
            file_type=file_type,
            file_size_mb=file_size_mb,
            raw_s3_key=s3_key,
            status="processing",
        )
        db.session.add(upload)
        db.session.commit()

        cls._spawn_processing_thread(app, upload.id)
        return upload

    @classmethod
    def list_uploads(cls, item_id: int | None = None) -> list[GeoDataUpload]:
        """Return the most-recent uploads, optionally filtered by item_id."""
        query = db.session.query(GeoDataUpload)
        
        if item_id:
            from submit_api.models.submission import Submission as SubmissionModel, SubmissionType
            submissions = db.session.query(SubmissionModel).filter_by(
                item_id=item_id,
                type=SubmissionType.DOCUMENT
            ).all()
            
            urls = [sub.submitted_document.url for sub in submissions if sub.submitted_document and sub.submitted_document.url]
            if not urls:
                return []
                
            query = query.filter(GeoDataUpload.raw_s3_key.in_(urls))

        return (
            query
            .order_by(GeoDataUpload.created_at.desc())
            .limit(100)
            .all()
        )

    @classmethod
    def get_upload(cls, upload_id: int) -> GeoDataUpload | None:
        """Fetch a single GeoDataUpload by primary key."""
        return db.session.get(GeoDataUpload, upload_id)

    @classmethod
    def get_presigned_read_url(cls, upload_id: int, tier: str = "preview") -> dict:
        """Return a presigned S3 read URL and metadata for a ready upload.

        Raises:
            ValueError: if the upload does not exist or is not yet ready.
        """
        upload = cls.get_upload(upload_id)
        if not upload:
            raise LookupError(f"GeoDataUpload {upload_id} not found.")
        if upload.status != "ready":
            raise ValueError(f"GeoDataUpload {upload_id} is not ready (status: {upload.status}).")

        if tier not in ("preview", "standard"):
            tier = "preview"

        s3_key = upload.preview_s3_key if tier == "preview" else upload.standard_s3_key
        url = DocumentServiceClient.get_presigned_read_url(s3_key)

        return {
            "url": url,
            "bbox": upload.bbox,
            "feature_count": upload.feature_count,
            "geometry_type": upload.geometry_type,
            "crs_original": upload.crs_original,
        }

    @classmethod
    def retry_upload(cls, app, upload_id: int) -> GeoDataUpload:
        """Reset a failed upload and re-trigger processing.

        Raises:
            LookupError: if upload not found.
            ValueError: if upload is not in failed state.
        """
        upload = cls.get_upload(upload_id)
        if not upload:
            raise LookupError(f"GeoDataUpload {upload_id} not found.")
        if upload.status != "failed":
            raise ValueError("Only failed uploads can be retried.")

        upload.status = "processing"
        upload.error_message = None
        db.session.commit()

        cls._spawn_processing_thread(app, upload.id)
        return upload
