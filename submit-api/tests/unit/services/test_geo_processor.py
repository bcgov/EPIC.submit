"""Unit tests for geospatial processing orchestration."""
from __future__ import annotations

from unittest.mock import Mock, patch

from submit_api.services.geo import processor
from submit_api.services.geo.processor import GeoService


def test_submit_processing_job_uses_bounded_executor():
    """Geo uploads are submitted to the shared worker pool instead of a raw thread."""
    app = Mock()
    future = Mock()

    with patch.object(processor._GEO_EXECUTOR, "submit", return_value=future) as submit:
        GeoService.submit_processing_job(app, 42)

    submit.assert_called_once_with(GeoService._process_upload_in_background, app, 42)
    future.add_done_callback.assert_called_once_with(processor._log_processing_job_failure)
