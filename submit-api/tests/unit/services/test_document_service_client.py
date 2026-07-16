"""Unit tests for DocumentServiceClient upload helpers."""
from __future__ import annotations

from unittest.mock import Mock, patch

import pytest
import requests

from submit_api.services.document_service_client import DocumentServiceClient


def test_upload_file_via_presigned_url_streams_file(tmp_path):
    """Processed GeoJSON uploads are streamed from disk instead of passed as bytes."""
    file_path = tmp_path / "preview.geojson"
    file_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")
    response = Mock()
    response.raise_for_status = Mock()

    with patch("submit_api.services.document_service_client.requests.put", return_value=response) as put:
        DocumentServiceClient.upload_file_via_presigned_url("https://storage.example/upload", str(file_path))

    kwargs = put.call_args.kwargs
    assert kwargs["headers"] == {"Content-Type": "application/octet-stream"}
    assert kwargs["data"].name == str(file_path)
    response.raise_for_status.assert_called_once()


def test_upload_file_via_presigned_url_sanitizes_http_error(tmp_path):
    """Failed presigned uploads should not expose the signed URL in logs/errors."""
    file_path = tmp_path / "preview.geojson"
    file_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")

    response = Mock()
    response.status_code = 403
    response.raise_for_status.side_effect = requests.HTTPError(
        "403 Client Error: Forbidden for url: https://storage.example/upload?Signature=secret",
        response=response,
    )

    with patch("submit_api.services.document_service_client.requests.put", return_value=response):
        with pytest.raises(requests.HTTPError) as exc_info:
            DocumentServiceClient.upload_file_via_presigned_url(
                "https://storage.example/upload?Signature=secret",
                str(file_path),
            )

    assert str(exc_info.value) == "Presigned file upload failed with HTTP status 403"
