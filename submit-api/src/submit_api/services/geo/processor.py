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

import logging
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from time import perf_counter
from typing import Any, Dict

from flask import current_app

from submit_api.models import GeoDataUpload, Item as ItemModel, Submission as SubmissionModel, db
from submit_api.models.submission import SubmissionType
from submit_api.services.document_service_client import DocumentServiceClient
from submit_api.services.geo.ogr_converter import process_geo_file_with_timeout
from submit_api.services.geo.validator import validate_geo_file


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# GeoService — orchestration layer consumed by the API resources
# ---------------------------------------------------------------------------

# Max number of concurrent geospatial processing jobs to prevent resource exhaustion (RAM/CPU/DB)
GEO_MAX_CONCURRENT_JOBS = int(os.environ.get("GEO_MAX_CONCURRENT_JOBS", 3))
_GEO_EXECUTOR = ThreadPoolExecutor(
    max_workers=GEO_MAX_CONCURRENT_JOBS,
    thread_name_prefix="geo-processing",
)


def _log_processing_job_failure(future) -> None:
    """Log unexpected worker-pool failures that escaped normal upload handling."""
    try:
        future.result()
    except Exception:  # pylint: disable=broad-except
        logger.exception("Unhandled GeoDataUpload processing worker error.")


def _elapsed_ms(started_at: float) -> int:
    """Return elapsed milliseconds for compact operational logs."""
    return round((perf_counter() - started_at) * 1000)


class GeoService:
    """Service class for geospatial upload management."""

    # -- Background worker ---------------------------------------------------

    @classmethod
    def _validate_or_fail(cls, upload: GeoDataUpload, local_path: str) -> bool:
        """Run attribute validation, persisting a failure state if invalid.

        Returns True if the upload passed validation (or validation is skipped),
        False if it failed and the upload was marked ``validation_failed``.
        """
        if os.environ.get("SKIP_GEO_FILE_ATTR_VALIDATION", "false").lower() == "true":
            current_app.logger.info("GeoDataUpload %s validation skipped by configuration.", upload.id)
            return True

        is_valid, errors, summary = validate_geo_file(local_path)
        if is_valid:
            return True

        current_app.logger.warning(
            "Attribute validation failed for GeoDataUpload %s: %d error(s) in field(s): %s",
            upload.id,
            summary["total_errors"],
            ", ".join(summary["fields_with_errors"]) or "N/A",
        )
        upload.status = "validation_failed"
        upload.validation_errors = errors
        upload.error_message = cls._build_validation_message(errors, summary)
        db.session.commit()
        return False

    @staticmethod
    def _build_validation_message(errors: list[dict], summary: Dict[str, Any]) -> str:
        """Compose a human-readable summary covering each distinct failure type.

        The structured ``validation_errors`` list carries the per-feature detail;
        this string is the at-a-glance headline shown to the proponent.
        """
        def _count(*types: str) -> int:
            return sum(1 for e in errors if e.get("error_type") in types)

        missing_cols = [
            e["dbf_column"] for e in errors if e.get("error_type") == "missing_column"
        ]
        null_geom = _count("null_geometry")
        self_int = _count("self_intersection")
        invalid_geom = _count("invalid_geometry")
        attr_issues = _count("missing_value", "invalid_code")

        parts: list[str] = []
        if missing_cols:
            parts.append(f"missing required column(s): {', '.join(missing_cols)}")
        if null_geom:
            parts.append(f"{null_geom} feature(s) with missing or empty geometry")
        if self_int:
            parts.append(f"{self_int} self-intersecting polygon(s)")
        if invalid_geom:
            parts.append(f"{invalid_geom} feature(s) with invalid geometry")
        if attr_issues:
            parts.append(
                f"{attr_issues} attribute value issue(s) in: "
                f"{', '.join(summary['fields_with_errors']) or 'N/A'}"
            )

        if not parts:
            parts.append(
                f"{summary['total_errors']} issue(s) in: "
                f"{', '.join(summary['fields_with_errors']) or 'N/A'}"
            )

        prefix = "Capped at first " + str(len(errors)) + " issue(s). " if summary.get("capped") else ""
        return prefix + "Validation failed: " + "; ".join(parts) + "."

    @staticmethod
    def _upload_processed_tiers(upload: GeoDataUpload, result: Dict[str, Any]) -> None:
        """Upload processed tiers to S3 and record their keys on the upload."""
        for tier in ("preview", "standard"):
            s3_key = f"geo/processed/{upload.id}/{tier}.geojson"
            write_url, actual_s3_key = DocumentServiceClient.get_presigned_write_url(s3_key)
            DocumentServiceClient.upload_file_via_presigned_url(write_url, result["tiers"][tier])
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
            else:
                current_app.logger.error("Could not re-fetch GeoDataUpload %s after rollback.", upload_id)
        except Exception as fallback_exc:  # pylint: disable=broad-except # noqa: B902
            current_app.logger.error(
                "CRITICAL: Failed to save the error state for upload %s. "
                "The database might be unreachable: %s",
                upload_id, fallback_exc
            )

    @classmethod
    def _process_upload_in_background(cls, app, upload_id: int) -> None:
        """Download, convert, and re-upload a single GeoDataUpload."""
        with app.app_context():
            job_started_at = perf_counter()
            upload = db.session.get(GeoDataUpload, upload_id)
            if not upload:
                current_app.logger.error("GeoDataUpload %s not found.", upload_id)
                return

            try:
                current_app.logger.info(
                    "GeoDataUpload %s processing started (filename=%s, file_type=%s).",
                    upload.id,
                    upload.filename,
                    upload.file_type,
                )
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

                    # Keep generated tier files under the same temporary
                    # directory so they stay available until the presigned
                    # uploads finish, then are removed with the source file.
                    result = process_geo_file_with_timeout(local_path, tmpdir)
                    resource_usage = result.get("resource_usage", {})
                    cls._upload_processed_tiers(upload, result)

                metadata = result["metadata"]
                upload.feature_count = metadata["feature_count"]
                upload.geometry_type = metadata["geometry_type"]
                upload.crs_original = metadata["crs_original"]
                upload.bbox = metadata["bbox"]
                upload.status = "ready"
                db.session.commit()
                current_app.logger.info(
                    "GeoDataUpload %s processing completed in %sms "
                    "(feature_count=%s, geometry_type=%s, resource_usage=%s).",
                    upload_id,
                    _elapsed_ms(job_started_at),
                    metadata["feature_count"],
                    metadata["geometry_type"],
                    resource_usage,
                )

            except Exception as exc:  # pylint: disable=broad-except # noqa: B902
                current_app.logger.exception("Error processing GeoDataUpload %s: %s", upload_id, exc)
                cls._mark_upload_failed(upload_id, exc)

    @classmethod
    def submit_processing_job(cls, app, upload_id: int) -> None:
        """Submit the upload to the bounded in-process GIS worker pool."""
        future = _GEO_EXECUTOR.submit(cls._process_upload_in_background, app, upload_id)
        future.add_done_callback(_log_processing_job_failure)

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

        cls.submit_processing_job(app, upload.id)
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
    def approve_upload(cls, upload_id: int) -> GeoDataUpload:
        """Mark a processed upload as approved by the proponent.

        Raises:
            LookupError: if the upload does not exist.
            ValueError: if the upload is not in a 'ready' state.
        """
        upload = cls.get_upload(upload_id)
        if not upload:
            raise LookupError(f"GeoDataUpload {upload_id} not found.")
        if upload.status != "ready":
            raise ValueError(
                f"Only a ready upload can be approved (status: {upload.status})."
            )

        upload.is_approved = True
        db.session.commit()
        return upload

    @classmethod
    def has_unapproved_uploads(cls, item_id: int) -> bool:
        """Return True if the item has any geospatial upload not yet approved.

        Covers uploads still processing, failed, or ready-but-unapproved. Used to
        block completing a submission item until every file has been reviewed.
        """
        uploads = cls.list_uploads(item_id=item_id)
        return any(not upload.is_approved for upload in uploads)

    @classmethod
    def has_unapproved_uploads_for_package(cls, package_id: int) -> bool:
        """Return True if any geospatial upload in the package is not yet approved.

        Used to block submitting a package to the EAO until every geospatial file
        across all of its items has been reviewed and approved.
        """
        uploads = cls.list_uploads(package_id=package_id)
        return any(not upload.is_approved for upload in uploads)

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
        upload.is_approved = False
        upload.error_message = None
        upload.validation_errors = None
        db.session.commit()

        cls.submit_processing_job(app, upload.id)
        return upload
