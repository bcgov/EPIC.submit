"""Unit tests for IPD package Approve / Not Approved decision handling.

Covers the Approve path capturing a required Decision Date, the error paths
(open update requests, unsupported package type), and a regression guard that
recording an Approve or Not Approved decision queues no email.
"""
from contextlib import contextmanager
from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.package_type import PackageApprovalType
from submit_api.exceptions import BadRequestError
from submit_api.models.package import PackageStatus
from submit_api.services.package_service import PackageService


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Patch current_app so service logger calls work without an app context."""
    with patch("submit_api.services.package_service.current_app", new=Mock()):
        yield


@contextmanager
def _fake_session_scope():
    """Yield a mock session that behaves like the real session_scope contextmanager."""
    yield Mock()


def _type_c_package():
    """Build a mock Type C package with no items (document loop is a no-op)."""
    package = Mock()
    package.id = 1
    package.type.approval_type = PackageApprovalType.C
    package.items = []
    package.status = []
    package.decision_date = None
    return package


class TestApprovePackageDecisionDate:
    """Tests for PackageService.approve_package capturing the decision date."""

    @patch("submit_api.services.package_service.authorization.require_team_lead_access")
    @patch.object(PackageService, "_has_open_update_requests", return_value=False)
    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch.object(PackageService, "get_package_by_id")
    def test_approve_persists_decision_date(self, mock_get, _mock_open, _mock_auth):
        """Approving a Type C package persists the provided decision date."""
        package = _type_c_package()
        mock_get.return_value = package
        decision_date = datetime(2026, 1, 15)

        result = PackageService.approve_package(1, decision_date=decision_date)

        assert result.status == [PackageStatus.APPROVED.value]
        assert result.decision_date == decision_date

    @patch("submit_api.services.package_service.authorization.require_team_lead_access")
    @patch.object(PackageService, "_has_open_update_requests", return_value=True)
    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch.object(PackageService, "get_package_by_id")
    def test_approve_with_open_update_requests_raises(self, mock_get, _mock_open, _mock_auth):
        """Approving while open update requests exist raises a BadRequestError."""
        mock_get.return_value = _type_c_package()

        with pytest.raises(BadRequestError):
            PackageService.approve_package(1, decision_date=datetime(2026, 1, 15))

    @patch("submit_api.services.package_service.authorization.require_team_lead_access")
    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch.object(PackageService, "get_package_by_id")
    def test_approve_non_type_c_raises(self, mock_get, _mock_auth):
        """Approving a non Type C package raises a BadRequestError."""
        package = _type_c_package()
        package.type.approval_type = PackageApprovalType.A
        mock_get.return_value = package

        with pytest.raises(BadRequestError):
            PackageService.approve_package(1, decision_date=datetime(2026, 1, 15))


class TestDecisionSendsNoEmail:
    """Regression guard: recording a decision must not queue any email."""

    @patch("submit_api.services.package_service.SubmitEmailQueueService")
    @patch("submit_api.services.package_service.authorization.require_team_lead_access")
    @patch.object(PackageService, "_has_open_update_requests", return_value=False)
    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch.object(PackageService, "get_package_by_id")
    def test_approve_queues_no_email(self, mock_get, _mock_open, _mock_auth, mock_email):
        """Approving a package does not call the email queue service."""
        mock_get.return_value = _type_c_package()

        PackageService.approve_package(1, decision_date=datetime(2026, 1, 15))

        mock_email.queue_package_email.assert_not_called()
        mock_email.queue_package_submission_emails.assert_not_called()

    @patch("submit_api.services.package_service.SubmitEmailQueueService")
    @patch.object(PackageService, "create_new_package_from_original")
    @patch.object(PackageService, "_has_open_update_requests", return_value=False)
    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch.object(PackageService, "get_package_by_id")
    def test_refuse_queues_no_email(
        self, mock_get, _mock_open, mock_create_new, mock_email
    ):
        """Not approving a package does not call the email queue service."""
        package = _type_c_package()
        package.update_requests = []
        package.submitted_by = None
        package.account_project_work = None
        mock_get.return_value = package
        mock_create_new.return_value = _type_c_package()

        PackageService.refuse_package(1, datetime(2026, 1, 15))

        mock_email.queue_package_email.assert_not_called()
        mock_email.queue_package_submission_emails.assert_not_called()
