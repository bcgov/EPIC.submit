"""Unit tests for how acknowledging a package treats unsubmitted (PENDING) documents.

A document the holder added but has not submitted is invisible to staff, so
acknowledging a non-versioned package must not mark it ACKNOWLEDGED.
"""
from contextlib import contextmanager
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.package_type import PackageApprovalType
from submit_api.models.submission import SubmissionStatus, SubmissionType
from submit_api.services.package_service import PackageService


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Patch current_app so service logger calls work without an app context."""
    with patch('submit_api.services.package_service.current_app', new=Mock()):
        yield


@contextmanager
def _fake_session_scope():
    """Yield a mock session that behaves like the real session_scope contextmanager."""
    yield Mock()


def _document(status):
    """Build a mock DOCUMENT submission with the given status."""
    submission = Mock()
    submission.type = SubmissionType.DOCUMENT
    submission.status = status
    return submission


@patch('submit_api.services.package_service.SubmitEmailQueueService')
@patch('submit_api.services.package_service.session_scope', _fake_session_scope)
@patch('submit_api.services.package_service.authorization.require_team_lead_access')
@patch.object(PackageService, 'get_package_by_id')
def test_acknowledge_leaves_pending_documents_pending(mock_get, _mock_auth, _mock_email):
    """Acknowledging a non-versioned package skips documents the holder has not submitted."""
    verified = _document(SubmissionStatus.VERIFIED)
    pending = _document(SubmissionStatus.PENDING)
    item = Mock()
    item.submissions = [verified, pending]
    package = Mock()
    package.id = 1
    package.type.approval_type = PackageApprovalType.B
    package.type.versioning_enabled = False
    package.items = [item]
    package.status = []
    mock_get.return_value = package

    PackageService.acknowledge_package(1)

    assert verified.status == SubmissionStatus.ACKNOWLEDGED
    assert pending.status == SubmissionStatus.PENDING
