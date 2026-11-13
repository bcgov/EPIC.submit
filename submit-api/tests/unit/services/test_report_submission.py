"""Unit tests for report obligation submission validation."""
from unittest.mock import Mock, patch

import pytest
from faker import Faker

from submit_api.exceptions import BadRequestError
from submit_api.models.submission import SubmissionStatus
from submit_api.services.package_service import PackageService
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_document_submission_model,
    factory_item_model,
    factory_project_report_model,
    factory_project_model,
    factory_report_package_model,
    factory_user_model,
    set_global_token_info,
)

fake = Faker()


def _setup_report_package(session):
    """Create a report package with its single item and return (package, item, guid)."""
    set_global_token_info(TestJwtClaims.staff_admin_role)
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)

    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    project_report = factory_project_report_model(project_id=project.id)
    package = factory_report_package_model(account_project, project_report)
    item = factory_item_model(package=package, item_type_id=1, status="NEW",
                              submitted_by=auth_guid)
    session.flush()
    return package, item, auth_guid


def test_report_submission_requires_primary_document(session):
    """Submitting a report with only a supporting document is rejected."""
    package, item, auth_guid = _setup_report_package(session)
    factory_document_submission_model(
        item,
        created_by=auth_guid,
        folder="report_supporting_documents",
        sort_order=1,
    )
    session.flush()

    with pytest.raises(BadRequestError) as exc:
        PackageService._validate_report_submission(package)
    assert "Please upload a document." in str(exc.value)


def test_report_submission_rejected_with_no_documents(session):
    """Submitting a report with no documents is rejected."""
    package, _item, _auth_guid = _setup_report_package(session)
    session.flush()

    with pytest.raises(BadRequestError):
        PackageService._validate_report_submission(package)


def test_report_submission_passes_with_primary_document(session):
    """A report with a primary ('reports' folder) document passes validation."""
    package, item, auth_guid = _setup_report_package(session)
    factory_document_submission_model(item, created_by=auth_guid, folder="reports")
    session.flush()

    # Should not raise.
    PackageService._validate_report_submission(package)


class TestReportSubmitPreservesStatuses:
    """Submitting more documents must not reset already-processed documents."""

    @staticmethod
    def _make_package(type_name, statuses):
        """Build a mock package whose single item holds submissions with the given statuses."""
        package = Mock()
        package.id = 1
        package.account_project_work_id = None
        package.status = []
        package.type.name = type_name
        item = Mock()
        item.type.name = "Upload Files/Documents"
        item.submissions = [Mock(status=status) for status in statuses]
        package.items = [item]
        return package, item.submissions

    @staticmethod
    def _submit(package):
        """Run _submit_package with side-effect collaborators patched out."""
        with patch.object(PackageService, "_update_items_status"), \
                patch.object(PackageService, "_update_package_submission_details"), \
                patch.object(PackageService, "_close_carried_review_requests"), \
                patch.object(PackageService, "_create_email_queue_record"), \
                patch.object(PackageService, "_log_activity_submission"), \
                patch.object(PackageService, "_update_package_status"), \
                patch("submit_api.services.package_service.current_app"):
            PackageService._submit_package(package, Mock())

    def test_report_submit_keeps_verified_and_acknowledged(self):
        """Verified/acknowledged report documents keep their status; PENDING becomes SUBMITTED."""
        package, submissions = self._make_package(
            "Report",
            [SubmissionStatus.VERIFIED, SubmissionStatus.ACKNOWLEDGED, SubmissionStatus.PENDING],
        )

        self._submit(package)

        assert submissions[0].status == SubmissionStatus.VERIFIED
        assert submissions[1].status == SubmissionStatus.ACKNOWLEDGED
        assert submissions[2].status == SubmissionStatus.SUBMITTED

    def test_non_report_submit_still_sets_all_to_submitted(self):
        """Non-report packages keep the existing behaviour of submitting every document."""
        package, submissions = self._make_package(
            "Management Plan", [SubmissionStatus.PENDING, SubmissionStatus.PENDING],
        )

        self._submit(package)

        assert all(s.status == SubmissionStatus.SUBMITTED.value for s in submissions)
