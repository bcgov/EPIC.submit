"""Unit tests for the Regulated Party report card status (SUBMIT-1027).

The proponent-facing Reports card shows the badge of the newest main report /
notification document (the file in the ``reports`` folder), not a whole-package
aggregate:

- Submitted until EAO staff verify the newest main document.
- Verified once verified, for every report/notification type except Compliance
  Self-Reports (Report_TypeB), which stay Submitted until acknowledged.
- Acknowledged once the newest main document is acknowledged.
- Uploaded by EAO when the newest main document was uploaded by EAO staff
  (signal from SUBMIT-1041).
- Pending Acknowledgement is never shown to the Regulated Party.
- Supporting documents never drive the card status.
"""
from datetime import date, datetime, timedelta
from unittest.mock import Mock

from submit_api.enums.package_type import PackageTypeEnum
from submit_api.models.package import PackageStatus
from submit_api.models.submission import SubmissionStatus, SubmissionType
from submit_api.models.user import UserType
from submit_api.services.package_service import PackageService
from submit_api.utils.constants import (
    REPORTS_FOLDER,
    REPORT_SUPPORTING_DOCUMENTS_FOLDER,
)


_BASE_DATE = datetime(2026, 1, 1)


def _make_document_submission(status, created_offset_days=0,
                              folder=REPORTS_FOLDER, is_eao_uploaded=False,
                              received_date=None):
    """Build a mock DOCUMENT submission for the report card derivation."""
    submission = Mock()
    submission.type = SubmissionType.DOCUMENT
    submission.active = True
    submission.deleted = False
    submission.status = status
    submission.created_date = _BASE_DATE + timedelta(days=created_offset_days)
    submission.is_eao_uploaded = is_eao_uploaded
    submission.received_date = received_date
    document = Mock()
    document.folder = folder
    submission.submitted_document = document
    return submission


def _make_report_package(submissions, package_type=PackageTypeEnum.REPORT):
    """Build a mock report package carrying the given document submissions."""
    package = Mock()
    package_type_mock = Mock()
    package_type_mock.name = package_type.value
    package.type = package_type_mock
    item = Mock()
    item.submissions = submissions
    package.items = [item]
    package.update_requests = []
    version_mock = Mock()
    version_mock.version = 1
    package.version = version_mock
    return package


class TestReportCardStatusForProponent:
    """Newest-main-document status derivation for the Regulated Party card."""

    def test_no_main_document_returns_empty(self):
        """No submissions yields an empty list so the card shows the None placeholder."""
        package = _make_report_package([])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == []

    def test_supporting_document_only_never_sets_status(self):
        """A supporting-document-only package has no main document, so no status."""
        package = _make_report_package([
            _make_document_submission(
                SubmissionStatus.SUBMITTED.value,
                folder=REPORT_SUPPORTING_DOCUMENTS_FOLDER,
            ),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == []

    def test_submitted_main_document_shows_submitted(self):
        """A submitted, unverified main report shows Submitted."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.SUBMITTED.value),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.SUBMITTED.value]

    def test_verified_non_csr_shows_verified(self):
        """A verified non-Compliance report shows Verified to the Regulated Party."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.VERIFIED.value),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.VERIFIED.value]

    def test_verified_csr_stays_submitted(self):
        """A verified Compliance Self-Report stays Submitted until acknowledged."""
        package = _make_report_package(
            [_make_document_submission(SubmissionStatus.VERIFIED.value)],
            package_type=PackageTypeEnum.REPORT_TYPE_B,
        )

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.SUBMITTED.value]
        assert PackageStatus.PENDING_ACKNOWLEDGEMENT.value not in result

    def test_acknowledged_csr_shows_acknowledged(self):
        """An acknowledged Compliance Self-Report main report shows Acknowledged."""
        package = _make_report_package(
            [_make_document_submission(SubmissionStatus.ACKNOWLEDGED.value)],
            package_type=PackageTypeEnum.REPORT_TYPE_B,
        )

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.ACKNOWLEDGED.value]

    def test_eao_uploaded_newest_main_shows_uploaded_by_eao(self):
        """An EAO-uploaded newest main document shows Uploaded by EAO."""
        package = _make_report_package([
            _make_document_submission(
                SubmissionStatus.SUBMITTED.value, is_eao_uploaded=True,
            ),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.UPLOADED_BY_EAO.value]

    def test_newest_main_document_wins(self):
        """The newest main document drives the status, not older ones."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.VERIFIED.value, created_offset_days=0),
            _make_document_submission(SubmissionStatus.SUBMITTED.value, created_offset_days=5),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.SUBMITTED.value]

    def test_supporting_document_does_not_override_main(self):
        """A newer supporting document does not change the card status."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.VERIFIED.value, created_offset_days=0),
            _make_document_submission(
                SubmissionStatus.SUBMITTED.value,
                created_offset_days=10,
                folder=REPORT_SUPPORTING_DOCUMENTS_FOLDER,
            ),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.VERIFIED.value]


class TestReportCardStatusForStaff:
    """EAO card: New Submission while any Regulated Party document is unverified."""

    @staticmethod
    def _package(statuses, aggregate, package_type=PackageTypeEnum.REPORT):
        """Report package with documents in the given statuses and a stored aggregate status."""
        package = _make_report_package(
            [_make_document_submission(s, created_offset_days=i) for i, s in enumerate(statuses)],
            package_type=package_type,
        )
        package.status = aggregate
        return package

    def test_no_documents_shows_none(self):
        """Nothing submitted gives no status, so the card shows '-'."""
        package = self._package([], [PackageStatus.NEW.value])

        assert PackageService.calculate_package_statuses(package, UserType.STAFF) == []

    def test_pending_documents_only_shows_none(self):
        """Documents added but not yet submitted do not count as submitted."""
        package = self._package([SubmissionStatus.PENDING.value], [PackageStatus.NEW.value])

        assert PackageService.calculate_package_statuses(package, UserType.STAFF) == []

    def test_submitted_document_shows_new_submission(self):
        """An unverified document shows New Submission."""
        package = self._package(
            [SubmissionStatus.SUBMITTED.value], [PackageStatus.SUBMITTED.value])

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.NEW_SUBMISSION.value]

    def test_partially_verified_still_shows_new_submission(self):
        """Some documents verified but one unverified: still New Submission, never '-'."""
        package = self._package(
            [SubmissionStatus.VERIFIED.value, SubmissionStatus.SUBMITTED.value],
            [PackageStatus.INTERNAL_VERIFICATION.value],
        )

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.NEW_SUBMISSION.value]

    def test_all_verified_leaves_new_submission(self):
        """Once every document is verified the package-level status takes over."""
        package = self._package(
            [SubmissionStatus.VERIFIED], [PackageStatus.VERIFIED.value])

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert PackageStatus.NEW_SUBMISSION.value not in result
        assert PackageStatus.VERIFIED.value in result

    def test_eao_uploaded_document_does_not_count_as_new_submission(self):
        """A document EAO staff uploaded never makes the card New Submission."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.SUBMITTED.value, is_eao_uploaded=True),
        ])
        package.status = [PackageStatus.SUBMITTED.value]

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert PackageStatus.NEW_SUBMISSION.value not in result

    def test_only_eao_uploaded_documents_show_uploaded_by_eao(self):
        """When every document was uploaded by EAO the card reads Uploaded by EAO."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.SUBMITTED.value, is_eao_uploaded=True),
            _make_document_submission(SubmissionStatus.SUBMITTED.value, is_eao_uploaded=True,
                                      created_offset_days=1),
        ])
        package.status = [PackageStatus.SUBMITTED.value]

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.UPLOADED_BY_EAO.value]

    def test_eao_document_beside_unverified_holder_document_is_new_submission(self):
        """A holder document still awaiting verification wins over EAO-uploaded ones."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.SUBMITTED.value, is_eao_uploaded=True),
            _make_document_submission(SubmissionStatus.SUBMITTED.value, created_offset_days=1),
        ])
        package.status = [PackageStatus.SUBMITTED.value]

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.NEW_SUBMISSION.value]

    def test_pending_documents_only_still_shows_none(self):
        """Unsubmitted holder documents with no EAO uploads keep the card at '-'."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.PENDING.value),
        ])
        package.status = [PackageStatus.NEW.value]

        assert PackageService.calculate_package_statuses(package, UserType.STAFF) == []


class TestReportCardUsesReceivedDate:
    """The newest main document counts from the date received for EAO uploads."""

    def test_eao_document_received_earlier_does_not_overtake_newer_holder_document(self):
        """An EAO upload made today but received last year loses to a newer holder document."""
        package = _make_report_package([
            _make_document_submission(
                SubmissionStatus.SUBMITTED.value, created_offset_days=30,
                is_eao_uploaded=True, received_date=date(2026, 1, 5),
            ),
            _make_document_submission(SubmissionStatus.VERIFIED.value, created_offset_days=10),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.VERIFIED.value]

    def test_eao_document_received_later_wins(self):
        """An EAO upload received after the holder's document drives the card."""
        package = _make_report_package([
            _make_document_submission(SubmissionStatus.VERIFIED.value, created_offset_days=1),
            _make_document_submission(
                SubmissionStatus.SUBMITTED.value, created_offset_days=0,
                is_eao_uploaded=True, received_date=date(2026, 6, 1),
            ),
        ])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.UPLOADED_BY_EAO.value]
