"""Unit tests for adding report/notification documents on behalf of the holder.

Covers the EAO-upload helpers on SubmissionService, the role helper, the
effective-date rule and the status aggregation that ignores EAO-uploaded rows.
"""
from datetime import date, datetime, timedelta
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.package_type import PackageApprovalType, PackageTypeEnum
from submit_api.exceptions import PermissionDeniedError, UnprocessableEntityError
from submit_api.models.package import PackageStatus
from submit_api.models.queries.package import PackageSubmissionQueries
from submit_api.models.submission import SubmissionStatus, SubmissionType, effective_submission_date
from submit_api.models.user import UserType
from submit_api.services.submission import SubmissionService

SERVICE = "submit_api.services.submission"


def _item(package_type_name=PackageTypeEnum.REPORT.value):
    """Mock item whose package has the given type."""
    item = Mock()
    item.package.type.name = package_type_name
    return item


def _request(received_date=None, submission_type=SubmissionType.DOCUMENT.value):
    """Mock EAO-upload request body."""
    return {"type": submission_type, "received_date": received_date or date.today() - timedelta(days=1)}


class TestRequireEaoReportUploadAccess:
    """Only MPT Staff / MPT Manager (or full_access) staff may add or remove EAO uploads."""

    @staticmethod
    def _run(user_type, has_role):
        """Run the check with a user of the given type and role outcome."""
        user = Mock()
        user.type = user_type
        with patch(f"{SERVICE}.UserModel.get_by_guid", return_value=user), \
                patch(f"{SERVICE}.TokenInfo.get_username", return_value="guid"), \
                patch("submit_api.services.package_access_control.PackageAccessControl."
                      "has_report_eao_upload_role", return_value=has_role):
            SubmissionService._require_eao_report_upload_access()

    def test_staff_with_role_is_allowed(self):
        """Staff with an MPT role pass."""
        self._run(UserType.STAFF, True)

    def test_staff_without_role_is_forbidden(self):
        """Staff without an MPT role are rejected."""
        with pytest.raises(PermissionDeniedError):
            self._run(UserType.STAFF, False)

    def test_proponent_is_forbidden(self):
        """A Regulated Party user is rejected even if the role check would pass."""
        with pytest.raises(PermissionDeniedError):
            self._run(UserType.PROPONENT, True)

    def test_unknown_user_is_forbidden(self):
        """No user record is rejected."""
        with patch(f"{SERVICE}.UserModel.get_by_guid", return_value=None), \
                patch(f"{SERVICE}.TokenInfo.get_username", return_value="guid"):
            with pytest.raises(PermissionDeniedError):
                SubmissionService._require_eao_report_upload_access()


class TestValidateEaoUpload:
    """Validation of the item, document type and date received."""

    @staticmethod
    def _validate(item, request):
        """Run the validation with access granted and the given item."""
        with patch.object(SubmissionService, "_require_eao_report_upload_access"), \
                patch.object(SubmissionService, "_local_today", return_value=date.today()), \
                patch(f"{SERVICE}.ItemModel.find_by_id", return_value=item):
            SubmissionService._validate_eao_upload(1, request)

    def test_valid_upload_passes(self):
        """A report document with a past date is accepted."""
        self._validate(_item(), _request())

    def test_today_passes(self):
        """Today is not in the future."""
        self._validate(_item(), _request(date.today()))

    def test_access_is_checked_first(self):
        """A missing role stops the request before any other validation."""
        with patch.object(SubmissionService, "_require_eao_report_upload_access",
                          side_effect=PermissionDeniedError("no")):
            with pytest.raises(PermissionDeniedError):
                SubmissionService._validate_eao_upload(1, _request())

    def test_non_report_package_is_rejected(self):
        """Other package types cannot take EAO uploads."""
        with pytest.raises(UnprocessableEntityError):
            self._validate(_item("Management Plan"), _request())

    def test_missing_item_is_rejected(self):
        """An unknown item is rejected."""
        with pytest.raises(UnprocessableEntityError):
            self._validate(None, _request())

    def test_non_document_is_rejected(self):
        """Only documents can be added this way."""
        with pytest.raises(UnprocessableEntityError):
            self._validate(_item(), _request(submission_type=SubmissionType.FORM.value))

    def test_missing_date_is_rejected(self):
        """Date Received is required."""
        request = _request()
        request["received_date"] = None
        with pytest.raises(UnprocessableEntityError, match="Please enter the date"):
            self._validate(_item(), request)

    def test_future_date_is_rejected(self):
        """Date Received cannot be in the future."""
        with pytest.raises(UnprocessableEntityError, match="cannot be in the future"):
            self._validate(_item(), _request(date.today() + timedelta(days=3)))


class TestBuildDocumentSubmissionData:
    """Client-supplied flags are never trusted."""

    def test_normal_upload_drops_client_eao_fields(self):
        """EAO fields and status inside data are removed for a normal upload."""
        request = {"data": {"name": "a.pdf", "is_eao_uploaded": True, "received_date": "2026-01-01",
                            "status": "VERIFIED"}, "sort_order": 0}

        data = SubmissionService._build_document_submission_data(request, is_eao_upload=False)

        assert data == {"name": "a.pdf", "sort_order": 0}

    def test_eao_upload_sets_flag_and_date(self):
        """An EAO upload carries the flag and the date received."""
        request = {"data": {"name": "a.pdf"}, "sort_order": 1, "received_date": date(2026, 1, 2)}

        data = SubmissionService._build_document_submission_data(request, is_eao_upload=True)

        assert data["is_eao_uploaded"] is True
        assert data["received_date"] == date(2026, 1, 2)
        assert data["sort_order"] == 1


class TestEffectiveSubmissionDate:
    """Date Submitted is the date received for EAO uploads, otherwise the upload date."""

    def test_uses_received_date_when_set(self):
        """The received date wins over the upload date."""
        submission = Mock(received_date=date(2026, 10, 9), created_date=datetime(2026, 11, 1, 3, 0))

        assert effective_submission_date(submission) == date(2026, 10, 9)

    def test_falls_back_to_created_date(self):
        """Without a received date the upload date is used."""
        submission = Mock(received_date=None, created_date=datetime(2026, 9, 30, 12, 0))

        assert effective_submission_date(submission) == date(2026, 9, 30)

    def test_no_dates_returns_none(self):
        """Nothing to go on returns None."""
        assert effective_submission_date(Mock(received_date=None, created_date=None)) is None


class TestAggregateIgnoresEaoUploads:
    """EAO-uploaded rows never hold the package in a partly verified state."""

    @staticmethod
    def _submission(status, is_eao_uploaded=False):
        """Mock active document submission."""
        submission = Mock()
        submission.active = True
        submission.deleted = False
        submission.type = SubmissionType.DOCUMENT
        submission.status = status
        submission.is_eao_uploaded = is_eao_uploaded
        return submission

    @classmethod
    def _package(cls, submissions):
        """Mock report package holding the submissions."""
        package = Mock()
        package.account_project_work_id = None
        package.type.approval_type = PackageApprovalType.A
        item = Mock()
        item.submissions = submissions
        package.items = [item]
        return package

    def test_eao_row_does_not_block_verified(self):
        """A verified holder document plus an EAO upload is still Verified."""
        package = self._package([
            self._submission(SubmissionStatus.VERIFIED),
            self._submission(SubmissionStatus.SUBMITTED, is_eao_uploaded=True),
        ])

        statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

        assert PackageStatus.VERIFIED.value in statuses
        assert PackageStatus.INTERNAL_VERIFICATION.value not in statuses

    def test_only_eao_rows_counts_as_no_submissions(self):
        """A package with only EAO uploads has no verification state of its own."""
        package = self._package([self._submission(SubmissionStatus.SUBMITTED, is_eao_uploaded=True)])

        statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)

        assert statuses == [PackageStatus.NEW.value]
