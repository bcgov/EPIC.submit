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
"""API blueprint for geospatial upload management.

All business logic lives in :mod:`submit_api.services.geo_processor`.
These route handlers are intentionally thin: validate → delegate → respond.
"""
import json
import logging
import time
from http import HTTPStatus

from flask import Response, current_app, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.auth import auth
from submit_api.models import GeoDataUpload, Item, Submission, SubmittedDocument, db
from submit_api.services import authorization
from submit_api.exceptions import BadRequestError, PermissionDeniedError, ResourceNotFoundError
from submit_api.services.geo import GeoService
from submit_api.utils.util import allowedorigins, cors_preflight


API = Namespace("uploads", description="Endpoints for Geospatial Uploads")
logger = logging.getLogger(__name__)


def _check_item_access(item_id):
    item = Item.find_by_id(item_id)
    if not item:
        raise ResourceNotFoundError("Item not found")
    authorization.has_access_to_package(item.package_id)


def _check_key_access(s3_key):
    if not s3_key:
        raise BadRequestError("A submitted document key is required")
    submissions = Submission.query.join(SubmittedDocument).filter(SubmittedDocument.url == s3_key).all()
    if not submissions:
        raise PermissionDeniedError("Upload is not attached to an accessible submission")
    # Fail closed for keys shared between packages until storage ownership is established.
    for package_id in {s.item.package_id for s in submissions}:
        authorization.has_access_to_package(package_id)


def _check_upload_access(upload_id):
    upload = db.session.get(GeoDataUpload, upload_id)
    if not upload:
        raise ResourceNotFoundError("Upload not found")
    _check_key_access(upload.raw_s3_key)


@cors_preflight("GET, POST, OPTIONS")
@API.route("", methods=["GET", "POST", "OPTIONS"])
class GeoUploads(Resource):
    """Resource for managing geo uploads."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.require
    def post():
        """Create a GeoDataUpload record and kick off background processing."""
        data = request.get_json()
        _check_key_access(data.get("s3_key"))
        try:
            upload = GeoService.create_upload(
                app=current_app._get_current_object(),  # pylint:disable=protected-access  # noqa: SLF001
                filename=data.get("filename"),
                file_type=data.get("file_type"),
                file_size_kb=data.get("file_size_kb"),
                s3_key=data.get("s3_key"),
            )
        except ValueError as exc:
            return {"error": str(exc)}, HTTPStatus.BAD_REQUEST

        return {"id": upload.id, "status": upload.status}, HTTPStatus.CREATED

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.require
    def get():
        """Return the GeoDataUpload records for the specified item or package."""
        item_id = request.args.get("item_id", type=int)
        package_id = request.args.get("package_id", type=int)
        if not item_id and not package_id:
            raise BadRequestError("item_id or package_id is required")
        if item_id:
            _check_item_access(item_id)
        if package_id:
            authorization.has_access_to_package(package_id)
        uploads = GeoService.list_uploads(item_id=item_id, package_id=package_id)
        return [u.to_dict() for u in uploads], HTTPStatus.OK


@cors_preflight("GET, OPTIONS")
@API.route("/<int:upload_id>/status", methods=["GET", "OPTIONS"])
class GeoUploadStatus(Resource):
    """Resource for polling geo upload status."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.require
    def get(upload_id):
        """SSE stream that polls the processing status of a single upload."""
        _check_upload_access(upload_id)
        app = current_app._get_current_object()  # pylint:disable=protected-access  # noqa: SLF001

        def generate():
            with app.app_context():
                for _ in range(60):
                    upload = db.session.get(GeoDataUpload, upload_id)
                    if not upload:
                        yield 'data: {"error": "Upload not found"}\n\n'
                        return

                    payload = {"status": upload.status, "upload_id": upload.id}

                    if upload.status == "ready":
                        payload.update({
                            "feature_count": upload.feature_count,
                            "geometry_type": upload.geometry_type,
                            "crs_original": upload.crs_original,
                            "bbox": upload.bbox,
                        })
                        yield f"data: {json.dumps(payload)}\n\n"
                        return

                    if upload.status in ("failed", "validation_failed"):
                        payload["error"] = upload.error_message
                        if upload.status == "validation_failed":
                            payload["validation_errors"] = upload.validation_errors
                        yield f"data: {json.dumps(payload)}\n\n"
                        return

                    yield f"data: {json.dumps(payload)}\n\n"
                    time.sleep(1.5)
                    db.session.expire_all()

        return Response(
            generate(),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )


@cors_preflight("GET, OPTIONS")
@API.route("/<int:upload_id>/url", methods=["GET", "OPTIONS"])
class GeoUploadUrl(Resource):
    """Resource for getting a presigned S3 read URL."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.require
    def get(upload_id):
        """Return a fresh presigned S3 read URL for a processed GeoDataUpload."""
        _check_upload_access(upload_id)
        tier = request.args.get("tier", "preview")
        try:
            result = GeoService.get_presigned_read_url(upload_id, tier)
        except LookupError as exc:
            return {"error": str(exc)}, HTTPStatus.NOT_FOUND
        except ValueError as exc:
            return {"error": str(exc)}, HTTPStatus.BAD_REQUEST
        except Exception as exc:  # pylint: disable=broad-except # noqa: B902
            logger.exception("Unexpected error fetching presigned URL: %s", exc)
            return {"error": "Unable to retrieve upload URL"}, HTTPStatus.INTERNAL_SERVER_ERROR

        return result, HTTPStatus.OK


@cors_preflight("POST, OPTIONS")
@API.route("/<int:upload_id>/approve", methods=["POST", "OPTIONS"])
class GeoUploadApprove(Resource):
    """Resource for approving a processed upload."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.require
    def post(upload_id):
        """Mark a ready upload as approved by the proponent."""
        _check_upload_access(upload_id)
        try:
            upload = GeoService.approve_upload(upload_id)
        except LookupError as exc:
            return {"error": str(exc)}, HTTPStatus.NOT_FOUND
        except ValueError as exc:
            return {"error": str(exc)}, HTTPStatus.BAD_REQUEST

        return {"id": upload.id, "status": upload.status, "is_approved": upload.is_approved}, HTTPStatus.OK


@cors_preflight("POST, OPTIONS")
@API.route("/<int:upload_id>/retry", methods=["POST", "OPTIONS"])
class GeoUploadRetry(Resource):
    """Resource for retrying an upload."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.require
    def post(upload_id):
        """Re-trigger background processing for a failed upload."""
        _check_upload_access(upload_id)
        try:
            upload = GeoService.retry_upload(
                app=current_app._get_current_object(),  # pylint:disable=protected-access. # noqa: SLF001
                upload_id=upload_id,
            )
        except LookupError as exc:
            return {"error": str(exc)}, HTTPStatus.NOT_FOUND
        except ValueError as exc:
            return {"error": str(exc)}, HTTPStatus.BAD_REQUEST

        return {"id": upload.id, "status": upload.status}, HTTPStatus.OK
