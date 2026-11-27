"""Unit tests for virus-rejected documents in the verification workflow (SUBMIT-1086).

A document the virus scan rejected is treated as if it did not exist: it cannot be
verified, it does not hold the package back from acknowledgement, and acknowledging
the package leaves it untouched.
"""
from contextlib import contextmanager
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.package_type import PackageApprovalType, PackageTypeEnum
from submit_api.exceptions import BadRequestError
from submit_api.models.package import PackageStatus
from submit_api.models.queries.package import PackageItemQueries, PackageSubmissionQueries
from submit_api.models.submission import SubmissionStatus, SubmissionType, is_virus_rejected
from submit_api.models.submitted_document import VirusScanResult
from submit_api.models.user import UserType
from submit_api.services import submission as submission_module
from submit_api.services.package_service import PackageService
from submit_api.services.submission import SubmissionService


@contextmanager
def _fake_session_scope():
    """Yield a mock session that behaves like the real session_scope contextmanager."""
    yield Mock()


def _document(status, scan_result=VirusScanResult.CLEAN.value):
    """Create a mock active Regulated Party DOCUMENT submission."""
    submission = Mock()
    submission.active = True
    submission.deleted = False
    submission.type = SubmissionType.DOCUMENT
    submission.status = status
    submission.is_eao_uploaded = False
    submission.submitted_document.virus_scan_result = scan_result
    return submission


def _rejected(status=SubmissionStatus.SUBMITTED):
    """Create a mock document the virus scan rejected."""
    return _document(status, VirusScanResult.REJECTED.value)


def _package(approval_type, submissions):
    """Create a mock package with one item holding the given submissions."""
    package = Mock()
    package.account_project_work_id = None
    package.submitted_on = None
    package.type.approval_type = approval_type
    package.type.versioning_enabled = False
    package.status = []
    package.archived_on = None
    package.is_archived = False
    item = Mock()
    item.submissions = submissions
    package.items = [item]
    return package


class TestIsVirusRejected:
    """Tests for the is_virus_rejected helper."""

    def test_rejected_scan_result_is_virus_rejected(self):
        """A REJECTED scan result marks the submission as virus rejected."""
        assert is_virus_rejected(_rejected()) is True

    @pytest.mark.parametrize("scan_result", [None, VirusScanResult.CLEAN.value, VirusScanResult.FAILED.value])
    def test_other_scan_results_are_not_virus_rejected(self, scan_result):
        """Pending, clean and failed scans do not count as rejected."""
        assert is_virus_rejected(_document(SubmissionStatus.SUBMITTED, scan_result)) is False

    def test_submission_without_document_is_not_virus_rejected(self):
        """A submission with no document (a form) is never virus rejected."""
        submission = Mock()
        submission.submitted_document = None
        assert is_virus_rejected(submission) is False


class TestAggregateSubmissionStatuses:
    """Virus-rejected documents do not take part in the package status roll-up."""

    @pytest.mark.parametrize("approval_type", [PackageApprovalType.B, PackageApprovalType.C])
    def test_rejected_document_does_not_block_ready_for_acknowledgement(self, approval_type):
        """All other documents VERIFIED plus a rejected one is ready for acknowledgement."""
        package = _package(approval_type, [_document(SubmissionStatus.VERIFIED), _rejected()])

        statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

        assert statuses == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]

    def test_rejected_document_does_not_block_type_a_verified(self):
        """A Type A package with a rejected document still reaches VERIFIED."""
        package = _package(PackageApprovalType.A, [_document(SubmissionStatus.VERIFIED), _rejected()])

        assert PackageSubmissionQueries.aggregate_submission_statuses(package) == [PackageStatus.VERIFIED.value]

    def test_clean_unverified_document_still_blocks(self):
        """A clean SUBMITTED document still holds the package in internal verification."""
        package = _package(
            PackageApprovalType.B,
            [_document(SubmissionStatus.VERIFIED), _document(SubmissionStatus.SUBMITTED), _rejected()],
        )

        statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

        assert statuses == [PackageStatus.INTERNAL_VERIFICATION.value]

    def test_only_rejected_documents_does_not_reset_package_to_new(self):
        """A package holding only rejected documents keeps its submitted status."""
        package = _package(PackageApprovalType.B, [_rejected()])

        with patch.object(PackageItemQueries, "_get_required_item_statuses", return_value=["SUBMITTED"]):
            statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

        assert statuses == [PackageStatus.SUBMITTED.value]


class TestReportStaffCardStatuses:
    """The EAO report card ignores virus-rejected documents."""

    def test_rejected_document_does_not_show_new_submission(self):
        """A rejected SUBMITTED document does not keep the card on New Submission."""
        package = _package(PackageApprovalType.A, [_document(SubmissionStatus.VERIFIED), _rejected()])

        assert PackageService._calculate_report_staff_card_statuses(package) is None

    def test_clean_submitted_document_shows_new_submission(self):
        """A clean SUBMITTED document still shows New Submission."""
        package = _package(PackageApprovalType.A, [_document(SubmissionStatus.SUBMITTED), _rejected()])

        assert PackageService._calculate_report_staff_card_statuses(package) == [PackageStatus.NEW_SUBMISSION.value]


class TestUpdateSubmissionStatus:
    """A virus-rejected document cannot be verified or acknowledged."""

    @staticmethod
    def _patch(monkeypatch, submission, package):
        monkeypatch.setattr(submission_module, "session_scope", _fake_session_scope)
        monkeypatch.setattr(submission_module, "current_app", Mock())
        monkeypatch.setattr(SubmissionService, "get_submission_by_id", classmethod(lambda cls, _id: submission))
        monkeypatch.setattr(
            SubmissionService, "get_package_by_submission_id", classmethod(lambda cls, _id: package)
        )
        monkeypatch.setattr(
            submission_module.PackageSubmissionQueries, "update_package_status_from_submissions", Mock()
        )

    @pytest.mark.parametrize("current,target", [
        (SubmissionStatus.SUBMITTED, "VERIFIED"),
        (SubmissionStatus.VERIFIED, "ACKNOWLEDGED"),
    ])
    def test_rejected_document_cannot_be_verified_or_acknowledged(self, monkeypatch, current, target):
        """Verifying or acknowledging a rejected document is refused and leaves it unchanged."""
        submission = _rejected(current)
        self._patch(monkeypatch, submission, _package(PackageApprovalType.B, [submission]))

        with pytest.raises(BadRequestError):
            SubmissionService.update_submission_status(1, target)

        assert submission.status == current

    def test_rejected_document_verification_can_be_undone(self, monkeypatch):
        """A document verified before the scan rejected it can still be reverted."""
        submission = _rejected(SubmissionStatus.VERIFIED)
        self._patch(monkeypatch, submission, _package(PackageApprovalType.B, [submission]))

        SubmissionService.update_submission_status(1, "SUBMITTED")

        assert submission.status == "SUBMITTED"

    def test_clean_document_can_be_verified(self, monkeypatch):
        """A clean document is verified as before."""
        submission = _document(SubmissionStatus.SUBMITTED)
        self._patch(monkeypatch, submission, _package(PackageApprovalType.B, [submission]))

        SubmissionService.update_submission_status(1, "VERIFIED")

        assert submission.status == "VERIFIED"


class TestAcknowledgePackage:
    """Acknowledging a package leaves virus-rejected documents untouched."""

    @patch("submit_api.services.package_service.current_app", new=Mock())
    @patch("submit_api.services.package_service.SubmitEmailQueueService")
    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch("submit_api.services.package_service.authorization.require_team_lead_access")
    @patch.object(PackageService, "get_package_by_id")
    def test_acknowledge_skips_rejected_documents(self, mock_get, _mock_auth, _mock_email):
        """Clean documents become ACKNOWLEDGED; the rejected one keeps its status."""
        clean = _document(SubmissionStatus.VERIFIED)
        rejected = _rejected()
        package = _package(PackageApprovalType.B, [clean, rejected])
        mock_get.return_value = package

        PackageService.acknowledge_package(1)

        assert clean.status == SubmissionStatus.ACKNOWLEDGED
        assert rejected.status == SubmissionStatus.SUBMITTED
        assert package.status == [PackageStatus.ACKNOWLEDGED.value]


class TestStatusesOnceVirusRejectionsAreIgnored:
    """The status a held package is shown with is worked out without rewriting what is stored.

    The scan result is written outside the API, so nothing recalculates the stored
    package status when a document is rejected after the others were verified.
    """

    def test_package_held_by_rejected_document_is_released(self):
        """A stored INTERNAL_VERIFICATION status moves on once the rejected document is ignored."""
        package = _package(PackageApprovalType.B, [_document(SubmissionStatus.VERIFIED), _rejected()])
        package.status = [PackageStatus.INTERNAL_VERIFICATION]

        result = PackageService._statuses_once_virus_rejections_are_ignored(package)

        assert result == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]
        assert package.status == [PackageStatus.INTERNAL_VERIFICATION]

    def test_package_held_by_clean_document_is_not_released(self):
        """A clean unverified document still holds the package."""
        package = _package(
            PackageApprovalType.B,
            [_document(SubmissionStatus.VERIFIED), _document(SubmissionStatus.SUBMITTED), _rejected()],
        )
        package.status = [PackageStatus.INTERNAL_VERIFICATION]

        assert PackageService._statuses_once_virus_rejections_are_ignored(package) is None

    def test_package_without_rejected_document_is_not_recalculated(self):
        """Packages with no rejected document keep their stored status."""
        package = _package(PackageApprovalType.B, [_document(SubmissionStatus.VERIFIED)])
        package.status = [PackageStatus.INTERNAL_VERIFICATION]

        with patch.object(PackageSubmissionQueries, "aggregate_submission_statuses") as aggregate:
            result = PackageService._statuses_once_virus_rejections_are_ignored(package)

        assert result is None
        aggregate.assert_not_called()

    @pytest.mark.parametrize("stored", [PackageStatus.ACKNOWLEDGED, PackageStatus.SUBMITTED, PackageStatus.NEW])
    def test_package_in_another_status_is_not_recalculated(self, stored):
        """Only a package stuck in internal verification is released."""
        package = _package(PackageApprovalType.B, [_document(SubmissionStatus.VERIFIED), _rejected()])
        package.status = [stored]

        assert PackageService._statuses_once_virus_rejections_are_ignored(package) is None

    def test_package_whose_status_is_stored_as_text_is_released(self):
        """The stored status is recognised whether it holds enum members or their values."""
        package = _package(PackageApprovalType.B, [_document(SubmissionStatus.VERIFIED), _rejected()])
        package.status = [PackageStatus.INTERNAL_VERIFICATION.value]

        result = PackageService._statuses_once_virus_rejections_are_ignored(package)

        assert result == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]

    def test_missing_package_has_no_status(self):
        """A package that does not exist has nothing to release."""
        assert PackageService._statuses_once_virus_rejections_are_ignored(None) is None

    def test_reading_a_held_package_writes_nothing(self):
        """Reading a package by id returns it as stored."""
        package = _package(PackageApprovalType.B, [_document(SubmissionStatus.VERIFIED), _rejected()])
        package.status = [PackageStatus.INTERNAL_VERIFICATION]

        with patch("submit_api.services.package_service.authorization.has_access_to_package"), \
                patch("submit_api.services.package_service.PackageModel.get_package_by_id_with_items",
                      return_value=package):
            result = PackageService.get_package_by_id(1)

        assert result.status == [PackageStatus.INTERNAL_VERIFICATION]


class TestHeldPackageDisplayedStatus:
    """A held package is shown as released while its stored status stays as it is."""

    @staticmethod
    def _held_package(type_name, approval_type=PackageApprovalType.B):
        package = _package(approval_type, [_document(SubmissionStatus.VERIFIED), _rejected()])
        package.type.name = type_name
        package.status = [PackageStatus.INTERNAL_VERIFICATION]
        package.update_requests = []
        package.version.version = 1
        item = package.items[0]
        item.status.value = "SUBMITTED"
        for submission in item.submissions:
            submission.is_updated = False
        return package

    def test_staff_report_card_shows_ready_for_acknowledgement(self):
        """The EAO report card of a held report package does not fall back to the stale status."""
        package = self._held_package(PackageTypeEnum.REPORT.value)

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]

    def test_staff_sees_held_non_report_package_as_released(self):
        """Any held package is shown to staff with the status it will be released to."""
        package = self._held_package("IPD", PackageApprovalType.C)

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]

    def test_displaying_a_held_package_does_not_change_it(self):
        """Working out the displayed status leaves the stored status untouched."""
        package = self._held_package(PackageTypeEnum.REPORT.value)

        PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert package.status == [PackageStatus.INTERNAL_VERIFICATION]

    def test_package_held_by_clean_document_keeps_stored_status(self):
        """A package a clean document still holds back is shown from its stored status."""
        package = self._held_package("IPD", PackageApprovalType.C)
        package.items[0].submissions.append(_document(SubmissionStatus.SUBMITTED))
        package.items[0].submissions[-1].is_updated = False
        expected = PackageService.calculate_package_statuses(
            self._clean_twin(package), UserType.STAFF
        )

        assert PackageService.calculate_package_statuses(package, UserType.STAFF) == expected

    def _clean_twin(self, package):
        """Build the same package without the rejected document."""
        twin = self._held_package("IPD", PackageApprovalType.C)
        twin.items[0].submissions = [s for s in package.items[0].submissions if not is_virus_rejected(s)]
        return twin
