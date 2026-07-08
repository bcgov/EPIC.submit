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
import math
import os
import tempfile
import threading
import zipfile
import glob
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import pandas as pd
import geopandas as gpd

from submit_api.models import GeoDataUpload, Item as ItemModel, Submission as SubmissionModel, db
from submit_api.models.submission import SubmissionType
from submit_api.services.document_service_client import DocumentServiceClient
from submit_api.services.geo.validator import validate_geo_file


logger = logging.getLogger(__name__)
COLOR_PALETTE = [
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


def _read_shp_data(shp_file: str, index: int) -> gpd.GeoDataFrame:
    """Read a single shapefile and assign colors."""
    gdf = gpd.read_file(shp_file)

    # Assign distinct color per feature rather than per layer
    fill_colors, stroke_colors = [], []
    for idx in range(len(gdf)):
        f_col, s_col = COLOR_PALETTE[(idx + index) % len(COLOR_PALETTE)]
        fill_colors.append(f_col)
        stroke_colors.append(s_col)

    gdf["layer_color"] = fill_colors
    gdf["stroke_color"] = stroke_colors
    gdf["layer_name"] = os.path.basename(shp_file)
    return gdf


def _read_zip_layers(local_path: str) -> gpd.GeoDataFrame:
    """Read all .shp layers from a zip file and merge them."""
    with tempfile.TemporaryDirectory() as temp_dir:
        with zipfile.ZipFile(local_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)

        # Recursively find all .shp files
        shp_files = glob.glob(os.path.join(temp_dir, "**", "*.shp"), recursive=True)

        if not shp_files:
            raise ValueError("No .shp files found inside the zip archive.")

        # Sort to ensure consistent coloring order
        shp_files.sort()
        gdfs = [
            _read_shp_data(shp_file, i)
            for i, shp_file in enumerate(shp_files)
        ]

        if not gdfs:
            raise ValueError("Failed to read any geospatial layers from the zip file.")

        if len(gdfs) == 1:
            return gdfs[0]

        base_crs = gdfs[0].crs
        aligned_gdfs = []
        for gdf in gdfs:
            if gdf.crs != base_crs and base_crs is not None and gdf.crs is not None:
                aligned_gdfs.append(gdf.to_crs(base_crs))
            else:
                aligned_gdfs.append(gdf)
        return gpd.GeoDataFrame(pd.concat(aligned_gdfs, ignore_index=True), crs=base_crs)


def _generate_tier(
    df: gpd.GeoDataFrame, simplification: float, max_features: int | None = None
) -> bytes:
    """Simplify and down-sample a GeoDataFrame, returning UTF-8 GeoJSON bytes."""
    work_df = df.copy()

    # Ensure we start with valid geometries
    work_df = work_df[work_df.geometry.notnull() & ~work_df.geometry.is_empty]

    if max_features and len(work_df) > max_features:
        work_df = work_df.sample(n=max_features, random_state=42)

    # Only simplify if a non-zero factor is provided
    if simplification and simplification > 0:
        work_df.geometry = work_df.geometry.simplify(simplification, preserve_topology=True)
        # Re-drop any geometries that became empty after simplification
        work_df = work_df[work_df.geometry.notnull() & ~work_df.geometry.is_empty]

    return work_df.to_json().encode("utf-8")


def _ensure_wgs84(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Ensure the GeoDataFrame is in WGS-84 (EPSG:4326)."""
    if gdf.crs is None:
        logger.warning("No CRS found in file (missing .prj?). Assuming EPSG:4326.")
        gdf = gdf.set_crs("EPSG:4326")
    elif not gdf.crs.equals("EPSG:4326"):
        logger.info("Reprojecting from %s to EPSG:4326", gdf.crs)
        gdf = gdf.to_crs("EPSG:4326")

    # Drop any geometries that failed to reproject (can happen if coords are out of range)
    original_count = len(gdf)
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty]
    if len(gdf) < original_count:
        logger.info("Dropped %d null/empty geometries after reprojection", original_count - len(gdf))

    return gdf


def _get_bbox(gdf: gpd.GeoDataFrame) -> list[float]:
    """Calculate a safe WGS-84 bounding box for the GeoDataFrame."""
    if gdf.empty:
        return [0.0, 0.0, 0.0, 0.0]

    bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
    # Handle NaN in bounds
    bbox = []
    for i, val in enumerate(bounds):
        if not math.isfinite(val):
            # fallback to a sensible default if any coordinate is NaN
            logger.warning("Invalid coordinate detected in bounds: %s. Using default bbox.", val)
            return [-180.0, -90.0, 180.0, 90.0]

        if i % 2 == 0:  # X (longitude)
            bbox.append(float(max(-180, min(180, val))))
        else:  # Y (latitude)
            bbox.append(float(max(-90, min(90, val))))
    return bbox


def _load_gdf(local_path: str) -> gpd.GeoDataFrame:
    """Load a GeoDataFrame from a .shp or .zip file."""
    is_zip = local_path.lower().endswith(".zip")
    is_shp = local_path.lower().endswith(".shp")

    # SHAPE_RESTORE_SHX tells GDAL to reconstruct the missing .shx index
    _prev = os.environ.get("SHAPE_RESTORE_SHX")
    if is_shp:
        os.environ["SHAPE_RESTORE_SHX"] = "YES"

    try:
        if is_zip:
            return _read_zip_layers(local_path)

        try:
            gpd.read_file(local_path)
        except (IOError, ValueError, RuntimeError) as exc:
            if is_shp:
                raise ValueError(
                    "Failed to read .shp file. Please ensure all sidecar files (.shx, .dbf, .prj) "
                    "are included by uploading them together in a .zip archive."
                ) from exc
            raise exc

        return _read_shp_data(local_path, 0)
    finally:
        if is_shp:
            if _prev is None:
                os.environ.pop("SHAPE_RESTORE_SHX", None)
            else:
                os.environ["SHAPE_RESTORE_SHX"] = _prev


def process_geo_file(local_path: str) -> Dict[str, Any]:
    """Process a geospatial file into preview/standard tiers plus metadata.

    Args:
        local_path: Local filesystem path to a .shp or .zip file.

    Returns:
        dict with keys ``tiers`` (dict of bytes keyed by tier name) and
        ``metadata`` (feature_count, geometry_type, crs_original, bbox).
    """
    gdf = _load_gdf(local_path)

    crs_original = str(gdf.crs.to_string()) if gdf.crs else "Unknown"

    # Drop null / empty geometries
    original_count = len(gdf)
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty]
    logger.info("Dropped %d null or empty geometries", original_count - len(gdf))

    gdf = _ensure_wgs84(gdf)

    feature_count = len(gdf)
    geometry_type = gdf.geom_type.mode().iloc[0] if not gdf.empty else "Unknown"
    bbox = _get_bbox(gdf)

    # Drop columns that cannot be serialised to JSON
    cols_to_drop = []
    if not gdf.empty:
        for col in gdf.columns:
            if col == "geometry":
                continue
            sample = gdf[col].dropna().iloc[0] if not gdf[col].dropna().empty else None
            if sample is not None and not _is_json_serializable(sample):
                cols_to_drop.append(col)
    if cols_to_drop:
        logger.info("Dropped non-serialisable columns: %s", cols_to_drop)
        gdf = gdf.drop(columns=cols_to_drop)

    logger.info("Generating tiers…")
    return {
        "tiers": {
            "preview": _generate_tier(gdf, 0.000001, 10_000),
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
    def _validate_or_fail(upload: GeoDataUpload, local_path: str) -> bool:
        """Run attribute validation, persisting a failure state if invalid.

        Returns True if the upload passed validation (or validation is skipped),
        False if it failed and the upload was marked ``validation_failed``.
        """
        if os.environ.get("SKIP_GEO_FILE_ATTR_VALIDATION", "false").lower() == "true":
            return True

        is_valid, errors, summary = validate_geo_file(local_path)
        if is_valid:
            return True

        logger.warning(
            "Attribute validation failed for GeoDataUpload %s: %d error(s) in field(s): %s",
            upload.id,
            summary["total_errors"],
            ", ".join(summary["fields_with_errors"]) or "N/A",
        )
        upload.status = "validation_failed"
        upload.validation_errors = errors
        missing_cols = [
            e["dbf_column"] for e in errors if e.get("error_type") == "missing_column"
        ]
        if missing_cols:
            upload.error_message = (
                "The shapefile is missing required column(s): "
                f"{', '.join(missing_cols)}."
            )
        else:
            upload.error_message = (
                f"Attribute validation failed with {summary['total_errors']} issue(s) in: "
                f"{', '.join(summary['fields_with_errors']) or 'N/A'}."
            )
        db.session.commit()
        return False

    @staticmethod
    def _upload_processed_tiers(upload: GeoDataUpload, result: Dict[str, Any]) -> None:
        """Upload processed tiers to S3 and record their keys on the upload."""
        for tier in ("preview", "standard"):
            s3_key = f"geo/processed/{upload.id}/{tier}.geojson"
            write_url, actual_s3_key = DocumentServiceClient.get_presigned_write_url(s3_key)
            DocumentServiceClient.upload_via_presigned_url(write_url, result["tiers"][tier])
            if tier == "preview":
                upload.preview_s3_key = actual_s3_key
            else:
                upload.standard_s3_key = actual_s3_key

    @staticmethod
    def _mark_upload_failed(upload_id: int, exc: Exception) -> None:
        """Persist a failed state for the upload after an unexpected error."""
        try:
            # Rollback any pending or failed transaction state
            db.session.rollback()

            # Re-fetch the upload instance because it may be detached after rollback
            upload = db.session.get(GeoDataUpload, upload_id)
            if upload:
                upload.status = "failed"
                upload.error_message = str(exc)
                db.session.commit()
                logger.info("Successfully marked GeoDataUpload %s as failed.", upload_id)
            else:
                logger.error("Could not re-fetch GeoDataUpload %s after rollback.", upload_id)
        except Exception as fallback_exc:  # pylint: disable=broad-except # noqa: B902
            logger.error(
                "CRITICAL: Failed to save the error state for upload %s. "
                "The database might be unreachable: %s",
                upload_id, fallback_exc
            )

    @classmethod
    def _process_upload_in_background(cls, app, upload_id: int) -> None:
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

                        # Update file size in KB if it's currently 0.0 (or unknown)
                        if not upload.file_size_kb or upload.file_size_kb == 0.0:
                            upload.file_size_kb = round(os.path.getsize(local_path) / 1024, 2)
                            db.session.commit()

                        if not cls._validate_or_fail(upload, local_path):
                            return

                        result = process_geo_file(local_path)
                        cls._upload_processed_tiers(upload, result)

                    metadata = result["metadata"]
                    upload.feature_count = metadata["feature_count"]
                    upload.geometry_type = metadata["geometry_type"]
                    upload.crs_original = metadata["crs_original"]
                    upload.bbox = metadata["bbox"]
                    upload.status = "ready"
                    db.session.commit()
                    logger.info("Successfully processed GeoDataUpload %s", upload_id)

                except Exception as exc:  # pylint: disable=broad-except # noqa: B902
                    logger.exception("Error processing GeoDataUpload %s: %s", upload_id, exc)
                    cls._mark_upload_failed(upload_id, exc)

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
    # pylint: disable=too-many-arguments,R0917
    def create_upload(cls, app, filename: str, file_type: str, file_size_kb: float, s3_key: str) -> GeoDataUpload:
        """Create a GeoDataUpload record and kick off background processing."""
        if file_type not in ("shp", "zip"):
            raise ValueError("file_type must be 'shp' or 'zip'")

        upload = GeoDataUpload(
            filename=filename,
            file_type=file_type,
            file_size_kb=file_size_kb,
            raw_s3_key=s3_key,
            status="processing",
        )
        db.session.add(upload)
        db.session.commit()

        cls._spawn_processing_thread(app, upload.id)
        return upload

    @classmethod
    def fail_stale_uploads(cls, timeout_minutes: int = 15) -> None:
        """Find uploads stuck in 'processing' status for too long and mark them as failed."""
        threshold = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)

        stale_uploads = db.session.query(GeoDataUpload).filter(
            GeoDataUpload.status == "processing",
            GeoDataUpload.updated_at < threshold
        ).all()

        if stale_uploads:
            logger.warning("Found %d stale GeoDataUploads. Marking as failed.", len(stale_uploads))
            for upload in stale_uploads:
                upload.status = "failed"
                upload.error_message = "Processing timed out or was interrupted by a server restart."
            try:
                db.session.commit()
            except Exception as exc:  # pylint: disable=broad-except # noqa: B902
                logger.error("Failed to commit stale uploads cleanup: %s", exc)
                db.session.rollback()

    @classmethod
    def list_uploads(cls, item_id: int | None = None, package_id: int | None = None) -> list[GeoDataUpload]:
        """Return the most-recent uploads, optionally filtered by item_id or package_id."""
        cls.fail_stale_uploads(timeout_minutes=15)

        query = db.session.query(GeoDataUpload)

        if item_id or package_id:
            sub_query = db.session.query(SubmissionModel).filter(
                SubmissionModel.type == SubmissionType.DOCUMENT
            )

            if item_id:
                sub_query = sub_query.filter_by(item_id=item_id)
            elif package_id:
                sub_query = sub_query.join(ItemModel).filter(ItemModel.package_id == package_id)

            submissions = sub_query.all()

            urls = [
                sub.submitted_document.url
                for sub in submissions
                if sub.submitted_document and sub.submitted_document.url
            ]
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
        if upload.status not in ("failed", "validation_failed"):
            raise ValueError("Only failed uploads can be retried.")

        upload.status = "processing"
        upload.error_message = None
        upload.validation_errors = None
        db.session.commit()

        cls._spawn_processing_thread(app, upload.id)
        return upload
