"""Integration tests for the geospatial upload endpoints."""
from http import HTTPStatus
from unittest.mock import patch

from submit_api.models import GeoDataUpload
from tests.utilities.factory_utils import (
    factory_document_submission_model, factory_item_model, factory_package_model)


BASE_URL = "/api/geo/uploads"
JOB = "submit_api.services.geo.processor.GeoService.submit_processing_job"
CLIENT = "submit_api.services.geo.processor.DocumentServiceClient"


def _upload(session, **kwargs):
    """Persist a GeoDataUpload."""
    values = {"filename": "a.zip", "file_type": "zip", "raw_s3_key": "raw/a.zip", "status": "ready"}
    values.update(kwargs)
    upload = GeoDataUpload(**values)
    session.add(upload)
    session.flush()
    return upload


def test_create_upload(session, client, auth_header):
    """Creating an upload stores the record and queues processing."""
    payload = {"filename": "f.zip", "file_type": "zip", "file_size_kb": 12.5, "s3_key": "raw/f.zip"}
    with patch(JOB) as job:
        response = client.post(BASE_URL, json=payload, headers=auth_header)

    assert response.status_code == HTTPStatus.CREATED
    assert response.get_json()["status"] == "processing"
    job.assert_called_once()


def test_create_upload_invalid_file_type(session, client, auth_header):
    """Unsupported file types are rejected with 400."""
    payload = {"filename": "f.txt", "file_type": "txt", "file_size_kb": 1, "s3_key": "raw/f.txt"}
    response = client.post(BASE_URL, json=payload, headers=auth_header)
    assert response.status_code == HTTPStatus.BAD_REQUEST


def test_create_upload_unauthorized(client):
    """A missing token is rejected."""
    assert client.post(BASE_URL, json={}).status_code == HTTPStatus.UNAUTHORIZED


def test_list_uploads_all(session, client, auth_header):
    """Uploads are listed without filters."""
    upload = _upload(session)
    response = client.get(BASE_URL, headers=auth_header)
    assert response.status_code == HTTPStatus.OK
    assert upload.id in [u["id"] for u in response.get_json()]


def test_list_uploads_by_item_and_package(session, client, auth_header, creator):
    """Uploads can be filtered by the item or package they belong to."""
    package = factory_package_model()
    item = factory_item_model(package=package)
    submission = factory_document_submission_model(item, created_by=creator)
    upload = _upload(session, raw_s3_key=submission.submitted_document.url)

    by_item = client.get(f"{BASE_URL}?item_id={item.id}", headers=auth_header)
    by_package = client.get(f"{BASE_URL}?package_id={package.id}", headers=auth_header)

    assert [u["id"] for u in by_item.get_json()] == [upload.id]
    assert [u["id"] for u in by_package.get_json()] == [upload.id]


def test_list_uploads_without_documents_returns_empty(session, client, auth_header):
    """An item without documents has no uploads."""
    item = factory_item_model(package=factory_package_model())
    response = client.get(f"{BASE_URL}?item_id={item.id}", headers=auth_header)
    assert response.get_json() == []


def test_stale_processing_uploads_are_failed(session, client, auth_header):
    """Uploads stuck in processing are marked as failed on listing."""
    from datetime import datetime, timedelta, timezone

    upload = _upload(session, status="processing")
    upload.updated_at = datetime.now(timezone.utc) - timedelta(hours=2)
    session.flush()

    response = client.get(BASE_URL, headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    row = next(u for u in response.get_json() if u["id"] == upload.id)
    assert row["status"] == "failed"


def test_status_stream_ready(session, client, auth_header):
    """A ready upload streams its metadata and ends."""
    upload = _upload(session, feature_count=3, geometry_type="Polygon")
    response = client.get(f"{BASE_URL}/{upload.id}/status", headers=auth_header)
    body = response.get_data(as_text=True)
    assert response.status_code == HTTPStatus.OK
    assert '"status": "ready"' in body
    assert '"feature_count": 3' in body


def test_status_stream_not_found(session, client, auth_header):
    """An unknown upload streams an error."""
    response = client.get(f"{BASE_URL}/99999999/status", headers=auth_header)
    assert "Upload not found" in response.get_data(as_text=True)


def test_status_stream_failed(session, client, auth_header):
    """Failed uploads stream their error."""
    failed = _upload(session, status="failed", error_message="boom")
    body = client.get(f"{BASE_URL}/{failed.id}/status", headers=auth_header).get_data(as_text=True)
    assert "boom" in body


def test_status_stream_validation_failed(session, client, auth_header):
    """Validation failures stream their detailed errors."""
    invalid = _upload(session, status="validation_failed", error_message="bad", validation_errors=[{"x": 1}])
    body = client.get(f"{BASE_URL}/{invalid.id}/status", headers=auth_header).get_data(as_text=True)
    assert "validation_errors" in body


def test_status_stream_processing_polls_until_ready(session, client, auth_header):
    """A processing upload emits a status event and keeps polling."""
    upload = _upload(session, status="processing")

    def finish(_seconds):
        upload.status = "ready"
        session.flush()

    with patch("submit_api.resources.geo.time.sleep", side_effect=finish):
        body = client.get(f"{BASE_URL}/{upload.id}/status", headers=auth_header).get_data(as_text=True)

    assert '"status": "processing"' in body
    assert '"status": "ready"' in body


def test_get_presigned_url(session, client, auth_header):
    """A ready upload returns a presigned URL for the requested tier."""
    upload = _upload(session, preview_s3_key="p", standard_s3_key="s", bbox=[1, 2, 3, 4])
    with patch(CLIENT) as doc_client:
        doc_client.get_presigned_read_url.return_value = "https://signed"
        preview = client.get(f"{BASE_URL}/{upload.id}/url", headers=auth_header)
        standard = client.get(f"{BASE_URL}/{upload.id}/url?tier=standard", headers=auth_header)
        other = client.get(f"{BASE_URL}/{upload.id}/url?tier=weird", headers=auth_header)

    assert preview.status_code == HTTPStatus.OK
    assert preview.get_json()["url"] == "https://signed"
    assert standard.status_code == HTTPStatus.OK
    assert other.status_code == HTTPStatus.OK


def test_get_presigned_url_errors(session, client, auth_header):
    """Missing, not-ready, and failing uploads map to the right status codes."""
    pending = _upload(session, status="processing")
    ready = _upload(session)

    assert client.get(f"{BASE_URL}/99999999/url", headers=auth_header).status_code == HTTPStatus.NOT_FOUND
    assert client.get(f"{BASE_URL}/{pending.id}/url", headers=auth_header).status_code == HTTPStatus.BAD_REQUEST
    with patch(CLIENT) as doc_client:
        doc_client.get_presigned_read_url.side_effect = RuntimeError("s3 down")
        response = client.get(f"{BASE_URL}/{ready.id}/url", headers=auth_header)
    assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_approve_upload(session, client, auth_header):
    """A ready upload can be approved."""
    upload = _upload(session)
    response = client.post(f"{BASE_URL}/{upload.id}/approve", headers=auth_header)
    assert response.status_code == HTTPStatus.OK
    assert response.get_json()["is_approved"] is True


def test_approve_upload_errors(session, client, auth_header):
    """Unknown and not-ready uploads cannot be approved."""
    pending = _upload(session, status="processing")
    assert client.post(f"{BASE_URL}/99999999/approve", headers=auth_header).status_code == HTTPStatus.NOT_FOUND
    assert client.post(f"{BASE_URL}/{pending.id}/approve", headers=auth_header).status_code == HTTPStatus.BAD_REQUEST


def test_retry_upload(session, client, auth_header):
    """A failed upload is reset and requeued."""
    upload = _upload(session, status="failed", error_message="x", is_approved=True)
    with patch(JOB) as job:
        response = client.post(f"{BASE_URL}/{upload.id}/retry", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert response.get_json()["status"] == "processing"
    job.assert_called_once()


def test_retry_upload_errors(session, client, auth_header):
    """Unknown and non-failed uploads cannot be retried."""
    ready = _upload(session)
    assert client.post(f"{BASE_URL}/99999999/retry", headers=auth_header).status_code == HTTPStatus.NOT_FOUND
    assert client.post(f"{BASE_URL}/{ready.id}/retry", headers=auth_header).status_code == HTTPStatus.BAD_REQUEST


def test_has_unapproved_uploads_helpers(session, creator):
    """Unapproved-upload helpers reflect the approval state of linked uploads."""
    from submit_api.services.geo import GeoService

    package = factory_package_model()
    item = factory_item_model(package=package)
    submission = factory_document_submission_model(item, created_by=creator)
    upload = _upload(session, raw_s3_key=submission.submitted_document.url)

    assert GeoService.has_unapproved_uploads(item.id) is True
    assert GeoService.has_unapproved_uploads_for_package(package.id) is True
    upload.is_approved = True
    session.flush()
    assert GeoService.has_unapproved_uploads(item.id) is False
    assert GeoService.has_unapproved_uploads_for_package(package.id) is False


def test_background_processing_success(session, worker_app):
    """The worker converts, uploads tiers, and marks the upload ready."""
    from submit_api.services.geo import GeoService

    upload = _upload(session, status="processing", file_size_kb=0.0)
    result = {
        "tiers": {"preview": "p.geojson", "standard": "s.geojson"},
        "metadata": {"feature_count": 2, "geometry_type": "Polygon", "crs_original": "EPSG:4326",
                     "bbox": [0, 0, 1, 1]},
    }

    def fake_download(_url, path):
        with open(path, "wb") as handle:
            handle.write(b"x" * 2048)

    with patch(CLIENT) as doc_client, \
            patch("submit_api.services.geo.processor.validate_geo_file", return_value=(True, [], {})), \
            patch("submit_api.services.geo.processor.process_geo_file_with_timeout", return_value=result):
        doc_client.download_via_presigned_url.side_effect = fake_download
        doc_client.get_presigned_write_url.return_value = ("https://w", "key")
        GeoService._process_upload_in_background(worker_app, upload.id)

    assert upload.status == "ready"
    assert upload.feature_count == 2
    assert upload.preview_s3_key == "key"
    assert upload.file_size_kb == 2.0


def test_background_processing_validation_failure(session, worker_app):
    """Validation failures mark the upload validation_failed with a summary message."""
    from submit_api.services.geo import GeoService

    upload = _upload(session, status="processing", file_size_kb=5.0)
    errors = [
        {"error_type": "missing_column", "dbf_column": "NAME"},
        {"error_type": "null_geometry"},
        {"error_type": "self_intersection"},
        {"error_type": "invalid_geometry"},
        {"error_type": "missing_value"},
    ]
    summary = {"total_errors": 5, "fields_with_errors": ["NAME"], "capped": True}

    with patch(CLIENT), patch("submit_api.services.geo.processor.validate_geo_file",
                              return_value=(False, errors, summary)):
        GeoService._process_upload_in_background(worker_app, upload.id)

    assert upload.status == "validation_failed"
    assert "missing required column(s): NAME" in upload.error_message
    assert upload.error_message.startswith("Capped at first 5")


def test_background_processing_unexpected_error_marks_failed(session, worker_app):
    """Unexpected errors are recorded on the upload."""
    from submit_api.services.geo import GeoService

    upload = _upload(session, status="processing")
    with patch(CLIENT) as doc_client, patch.object(GeoService, "_mark_upload_failed") as mark_failed:
        doc_client.get_presigned_read_url.side_effect = RuntimeError("kaboom")
        GeoService._process_upload_in_background(worker_app, upload.id)

    mark_failed.assert_called_once()
    assert mark_failed.call_args.args[0] == upload.id
    assert str(mark_failed.call_args.args[1]) == "kaboom"


def test_background_processing_skips_validation_when_configured(session, monkeypatch):
    """Validation can be disabled by configuration."""
    from submit_api.services.geo import GeoService

    monkeypatch.setenv("SKIP_GEO_FILE_ATTR_VALIDATION", "true")
    upload = _upload(session, status="processing")
    assert GeoService._validate_or_fail(upload, "unused") is True


def test_background_processing_missing_upload(session, worker_app):
    """A missing upload id is logged and ignored."""
    from submit_api.services.geo import GeoService

    GeoService._process_upload_in_background(worker_app, 99999999)


def test_validation_message_without_specific_types():
    """The generic summary is used when no known error type matches."""
    from submit_api.services.geo import GeoService

    summary = {"total_errors": 1, "fields_with_errors": []}
    message = GeoService._build_validation_message([{"error_type": "other"}], summary)
    assert message == "Validation failed: 1 issue(s) in: N/A."


def test_mark_upload_failed_handles_missing_upload(session):
    """A vanished upload is logged rather than raising."""
    from submit_api.services.geo import GeoService

    GeoService._mark_upload_failed(99999999, RuntimeError("x"))
