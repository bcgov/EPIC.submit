"""Unit tests for DocumentServiceClient upload helpers."""
from __future__ import annotations

from unittest.mock import Mock, patch

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
