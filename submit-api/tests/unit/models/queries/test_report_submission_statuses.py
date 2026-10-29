"""Unit tests for report package status roll-up (SUBMIT-1042).

Covers how verified report documents roll up to the package status:
- Report (approval_type A): all docs VERIFIED -> VERIFIED only.
- Report_TypeB (approval_type B): all docs VERIFIED -> VERIFIED and
  PENDING_ACKNOWLEDGEMENT (the EAO-only Pending Acknowledgement card state).
"""
from unittest.mock import Mock

from submit_api.enums.package_type import PackageApprovalType
from submit_api.models.package import PackageStatus
from submit_api.models.queries.package import PackageSubmissionQueries
from submit_api.models.submission import SubmissionStatus, SubmissionType


def _make_document_submission(status):
    """Create a mock active DOCUMENT submission with the given status."""
    submission = Mock()
    submission.active = True
    submission.deleted = False
    submission.type = SubmissionType.DOCUMENT
    submission.status = status
    return submission


def _make_report_package(approval_type, submission_statuses):
    """Create a mock report package with one item holding the given submissions."""
    package = Mock()
    package.account_project_work_id = None
    package.submitted_on = None
    package.type = Mock()
    package.type.approval_type = approval_type

    item = Mock()
    item.submissions = [_make_document_submission(s) for s in submission_statuses]
    package.items = [item]
    return package


def test_report_type_a_all_verified_rolls_up_to_verified_only():
    """A Type A Report with all documents VERIFIED aggregates to VERIFIED only."""
    package = _make_report_package(
        PackageApprovalType.A, [SubmissionStatus.VERIFIED]
    )

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert PackageStatus.VERIFIED.value in statuses
    assert PackageStatus.PENDING_ACKNOWLEDGEMENT.value not in statuses


def test_report_type_b_all_verified_rolls_up_to_pending_acknowledgement():
    """A Type B Report (Report_TypeB) all VERIFIED adds PENDING_ACKNOWLEDGEMENT."""
    package = _make_report_package(
        PackageApprovalType.B, [SubmissionStatus.VERIFIED]
    )

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert PackageStatus.VERIFIED.value in statuses
    assert PackageStatus.PENDING_ACKNOWLEDGEMENT.value in statuses


def test_report_with_no_submissions_is_new():
    """A report package with no document submissions aggregates to NEW."""
    package = _make_report_package(PackageApprovalType.B, [])

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert statuses == [PackageStatus.NEW.value]
