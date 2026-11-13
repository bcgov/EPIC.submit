"""Unit tests for report package status roll-up (SUBMIT-1042).

Covers how verified report documents roll up to the package status:
- Report (approval_type A): all docs VERIFIED -> VERIFIED only.
- Approval types B and C: all docs VERIFIED -> READY_FOR_ACKNOWLEDGEMENT on its own
  (no VERIFIED and no PENDING_ACKNOWLEDGEMENT).
"""
from unittest.mock import Mock

import pytest

from submit_api.enums.package_type import PackageApprovalType
from submit_api.models.package import PackageStatus
from submit_api.models.queries.package import PackageSubmissionQueries
from submit_api.models.submission import SubmissionStatus, SubmissionType


def _make_document_submission(status, is_eao_uploaded=False):
    """Create a mock active DOCUMENT submission with the given status."""
    submission = Mock()
    submission.active = True
    submission.deleted = False
    submission.type = SubmissionType.DOCUMENT
    submission.status = status
    submission.is_eao_uploaded = is_eao_uploaded
    return submission


def _make_report_package(approval_type, submission_statuses, eao_uploaded_statuses=()):
    """Create a mock report package with one item holding the given submissions."""
    package = Mock()
    package.account_project_work_id = None
    package.submitted_on = None
    package.type = Mock()
    package.type.approval_type = approval_type

    item = Mock()
    item.submissions = [_make_document_submission(s) for s in submission_statuses] + [
        _make_document_submission(s, is_eao_uploaded=True) for s in eao_uploaded_statuses
    ]
    package.items = [item]
    return package


def test_report_type_a_all_verified_rolls_up_to_verified_only():
    """A Type A Report with all documents VERIFIED aggregates to VERIFIED only."""
    package = _make_report_package(
        PackageApprovalType.A, [SubmissionStatus.VERIFIED]
    )

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert PackageStatus.VERIFIED.value in statuses
    assert PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value not in statuses


@pytest.mark.parametrize("approval_type", [PackageApprovalType.B, PackageApprovalType.C])
def test_types_b_and_c_all_verified_roll_up_to_ready_for_acknowledgement(approval_type):
    """All documents VERIFIED yields READY_FOR_ACKNOWLEDGEMENT alone for types B and C."""
    package = _make_report_package(approval_type, [SubmissionStatus.VERIFIED, SubmissionStatus.VERIFIED])

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert statuses == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]


def test_type_c_verified_and_acknowledged_documents_are_ready_for_acknowledgement():
    """A mix of VERIFIED and ACKNOWLEDGED documents still reads as ready for acknowledgement."""
    package = _make_report_package(
        PackageApprovalType.C, [SubmissionStatus.VERIFIED, SubmissionStatus.ACKNOWLEDGED]
    )

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert statuses == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]


def test_type_c_partly_verified_is_internal_verification():
    """Undoing one verification returns the package to INTERNAL_VERIFICATION."""
    package = _make_report_package(
        PackageApprovalType.C, [SubmissionStatus.VERIFIED, SubmissionStatus.SUBMITTED]
    )

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert statuses == [PackageStatus.INTERNAL_VERIFICATION.value]


def test_eao_uploaded_document_does_not_hold_back_verified():
    """An EAO-uploaded document beside verified holder documents still rolls up to VERIFIED."""
    package = _make_report_package(
        PackageApprovalType.A,
        [SubmissionStatus.VERIFIED],
        eao_uploaded_statuses=[SubmissionStatus.SUBMITTED],
    )

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert PackageStatus.VERIFIED.value in statuses
    assert PackageStatus.INTERNAL_VERIFICATION.value not in statuses


def test_report_with_only_eao_uploaded_documents_is_new():
    """EAO-uploaded documents alone leave the package status at NEW."""
    package = _make_report_package(
        PackageApprovalType.A, [], eao_uploaded_statuses=[SubmissionStatus.SUBMITTED]
    )

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert statuses == [PackageStatus.NEW.value]


def test_report_with_no_submissions_is_new():
    """A report package with no document submissions aggregates to NEW."""
    package = _make_report_package(PackageApprovalType.B, [])

    statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

    assert statuses == [PackageStatus.NEW.value]
