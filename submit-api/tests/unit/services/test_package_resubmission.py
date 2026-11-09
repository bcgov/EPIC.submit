"""Unit tests for resubmission validation rules (D17 five-rule model).

Tests cover:
- Work packages before acknowledgement (free resubmit with completeness)
- Work packages after acknowledgement (requires update request)
- MP/IEM packages (always require update request)
- Failed consultation check (existing update request satisfies rule)
- Terminal state blocking (approved, rejected, not approved)
"""
from unittest.mock import Mock, patch, MagicMock

import pytest

import submit_api.services.package_service as package_service_module
from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import BadRequestError
from submit_api.models.item_type import SubmissionMethod
from submit_api.models.package import PackageStatus
from submit_api.models.submission import SubmissionType
from submit_api.models.update_request import UpdateRequestStatus, UpdateRequestType
from submit_api.services.package_service import PackageService


@pytest.fixture(autouse=True)
def mock_current_app():
    """Patch current_app to avoid application context errors."""
    mock_app = MagicMock()
    with patch.object(package_service_module, "current_app", mock_app):
        yield mock_app


def _make_package(
    submitted_on="2024-01-01",
    status=None,
    account_project_work_id=None,
    update_requests=None,
    items=None,
):
    """Create a mock package for testing."""
    package = Mock()
    package.id = 1
    package.submitted_on = submitted_on
    package.status = status or [PackageStatus.SUBMITTED.value]
    package.account_project_work_id = account_project_work_id
    package.update_requests = update_requests or []
    package.items = items or []
    package.type_id = 1
    return package


def _make_update_request(
    status=UpdateRequestStatus.OPEN.value,
    active=True,
    req_type=UpdateRequestType.UPDATE,
):
    """Create a mock update request."""
    ur = Mock()
    ur.status = status
    ur.active = active
    ur.type = req_type
    return ur


def _make_item(
    status=ItemStatus.COMPLETED.value,
    type_name="Section A",
    type_id=1,
    submissions=None,
    submission_method=SubmissionMethod.DOCUMENT_UPLOAD,
):
    """Create a mock item."""
    item = Mock()
    item.status = Mock()
    item.status.value = status
    item.type = Mock()
    item.type.name = type_name
    item.type.submission_method = submission_method
    item.type_id = type_id
    item.submissions = submissions if submissions is not None else [
        _make_submission()
    ]
    return item


def _make_submission(
    submission_type=SubmissionType.DOCUMENT,
    doc_id=1,
    form_id=None,
    deleted=False,
):
    """Create a mock submission."""
    sub = Mock()
    sub.type = submission_type
    sub.submitted_document_id = doc_id
    sub.submitted_form_id = form_id
    sub.deleted = deleted
    return sub


class TestTerminalStateBlocking:
    """Packages in terminal states cannot be resubmitted."""

    def test_approved_package_blocks_resubmit(self):
        """Approved package cannot be resubmitted."""
        package = _make_package(status=[PackageStatus.APPROVED.value])
        with pytest.raises(BadRequestError, match="approved"):
            PackageService._validate_package_for_resubmit(package)

    def test_rejected_package_blocks_resubmit(self):
        """Rejected package cannot be resubmitted."""
        package = _make_package(status=[PackageStatus.REJECTED.value])
        with pytest.raises(BadRequestError, match="rejected"):
            PackageService._validate_package_for_resubmit(package)

    def test_not_approved_package_blocks_resubmit(self):
        """NOT_APPROVED package cannot be resubmitted."""
        package = _make_package(status=[PackageStatus.NOT_APPROVED.value])
        with pytest.raises(BadRequestError, match="not been approved"):
            PackageService._validate_package_for_resubmit(package)

    def test_not_submitted_package_blocks_resubmit(self):
        """Package without submitted_on cannot be resubmitted."""
        package = _make_package(submitted_on=None)
        with pytest.raises(BadRequestError, match="has not been submitted"):
            PackageService._validate_package_for_resubmit(package)


class TestWorkPackagePreAcknowledgement:
    """Rule 1: Work packages before acknowledgement allow free resubmit with completeness."""

    @patch.object(PackageService, "_validate_completeness")
    def test_work_package_pre_ack_allows_resubmit(self, mock_validate):
        """Work package not acknowledged can resubmit without update request."""
        package = _make_package(
            account_project_work_id=10,
            status=[PackageStatus.SUBMITTED.value],
        )
        result = PackageService._validate_package_for_resubmit(package)
        assert result == package
        mock_validate.assert_called_once_with(package)

    @patch.object(PackageService, "_validate_completeness")
    def test_work_package_pre_ack_no_update_request_still_allowed(self, mock_validate):
        """Work package pre-ack doesn't need update requests."""
        package = _make_package(
            account_project_work_id=10,
            status=[PackageStatus.SUBMITTED.value],
            update_requests=[],
        )
        result = PackageService._validate_package_for_resubmit(package)
        assert result == package

    @patch.object(
        PackageService, "_validate_completeness",
        side_effect=BadRequestError("incomplete"),
    )
    def test_work_package_pre_ack_incomplete_blocks(self, _mock_validate):
        """Work package pre-ack blocks if completeness validation fails."""
        package = _make_package(
            account_project_work_id=10,
            status=[PackageStatus.SUBMITTED.value],
        )
        with pytest.raises(BadRequestError, match="incomplete"):
            PackageService._validate_package_for_resubmit(package)


class TestWorkPackagePostAcknowledgement:
    """Rule 2: Work packages after acknowledgement require an open update request."""

    @patch.object(PackageService, "_validate_no_empty_submissions")
    def test_work_package_post_ack_with_request_allows_resubmit(
        self, mock_validate_empty
    ):
        """Acknowledged work package with open update request can resubmit."""
        ur = _make_update_request(status=UpdateRequestStatus.OPEN.value)
        package = _make_package(
            account_project_work_id=10,
            status=[PackageStatus.ACKNOWLEDGED.value],
            update_requests=[ur],
        )
        result = PackageService._validate_package_for_resubmit(package)
        assert result == package
        mock_validate_empty.assert_called_once_with(package)

    def test_work_package_post_ack_no_request_blocks(self):
        """Acknowledged work package without update request blocks resubmit."""
        package = _make_package(
            account_project_work_id=10,
            status=[PackageStatus.ACKNOWLEDGED.value],
            update_requests=[],
        )
        with pytest.raises(BadRequestError, match="open update request"):
            PackageService._validate_package_for_resubmit(package)

    def test_work_package_post_ack_only_accepted_requests_blocks(self):
        """Acknowledged work package with only ACCEPTED requests blocks."""
        ur = _make_update_request(status=UpdateRequestStatus.ACCEPTED.value)
        package = _make_package(
            account_project_work_id=10,
            status=[PackageStatus.ACKNOWLEDGED.value],
            update_requests=[ur],
        )
        with pytest.raises(BadRequestError, match="open update request"):
            PackageService._validate_package_for_resubmit(package)


class TestMPIEMResubmission:
    """Rule 3: MP/IEM packages always require an open update request."""

    @patch.object(PackageService, "_validate_no_empty_submissions")
    def test_mp_package_with_open_request_allows_resubmit(
        self, mock_validate_empty
    ):
        """MP package with open update request can resubmit."""
        ur = _make_update_request(status=UpdateRequestStatus.OPEN.value)
        package = _make_package(
            account_project_work_id=None,
            status=[PackageStatus.SUBMITTED.value],
            update_requests=[ur],
        )
        result = PackageService._validate_package_for_resubmit(package)
        assert result == package
        mock_validate_empty.assert_called_once_with(package)

    def test_mp_package_no_request_blocks_resubmit(self):
        """MP package without update request blocks resubmit."""
        package = _make_package(
            account_project_work_id=None,
            status=[PackageStatus.SUBMITTED.value],
            update_requests=[],
        )
        with pytest.raises(BadRequestError, match="open update request"):
            PackageService._validate_package_for_resubmit(package)

    def test_mp_package_only_inactive_requests_blocks(self):
        """MP package with only inactive requests blocks resubmit."""
        ur = _make_update_request(
            status=UpdateRequestStatus.OPEN.value, active=False
        )
        package = _make_package(
            account_project_work_id=None,
            status=[PackageStatus.SUBMITTED.value],
            update_requests=[ur],
        )
        with pytest.raises(BadRequestError, match="open update request"):
            PackageService._validate_package_for_resubmit(package)

    @patch.object(PackageService, "_validate_no_empty_submissions")
    def test_mp_package_pending_review_request_allows_resubmit(
        self, mock_validate_empty
    ):
        """MP package with PENDING_REVIEW request can resubmit."""
        ur = _make_update_request(
            status=UpdateRequestStatus.PENDING_REVIEW.value
        )
        package = _make_package(
            account_project_work_id=None,
            status=[PackageStatus.SUBMITTED.value],
            update_requests=[ur],
        )
        result = PackageService._validate_package_for_resubmit(package)
        assert result == package


class TestFailedConsultationCheckResubmission:
    """Rule 4: After failed consultation check, REVIEW-type update request allows resubmit."""

    @patch.object(PackageService, "_validate_no_empty_submissions")
    def test_failed_cc_with_review_request_allows_resubmit(
        self, mock_validate_empty
    ):
        """Package with REVIEW-type update request (from failed CC) allows resubmit."""
        ur = _make_update_request(
            status=UpdateRequestStatus.OPEN.value,
            req_type=UpdateRequestType.REVIEW,
        )
        package = _make_package(
            account_project_work_id=None,
            status=[PackageStatus.SUBMITTED.value],
            update_requests=[ur],
        )
        result = PackageService._validate_package_for_resubmit(package)
        assert result == package


class TestValidateCompleteness:
    """Tests for _validate_completeness shared validation.

    Validates that each required item has at least one non-deleted document submission.
    """

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_package_with_docs_in_required_items_passes(
        self, mock_get_docs, mock_get_required
    ):
        """Package where all required items have documents passes."""
        mock_get_docs.return_value = [_make_submission()]
        item = _make_item(submissions=[_make_submission()])
        mock_get_required.return_value = [item]
        package = _make_package()
        # Should not raise
        PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_package_with_acknowledged_items_having_docs_passes(
        self, mock_get_docs, mock_get_required
    ):
        """Items in ACKNOWLEDGED status pass if they have document submissions."""
        mock_get_docs.return_value = [_make_submission()]
        item = _make_item(
            status=ItemStatus.ACKNOWLEDGED.value,
            submissions=[_make_submission()],
        )
        mock_get_required.return_value = [item]
        package = _make_package()
        # Should not raise - status doesn't matter, only documents
        PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_package_with_verified_items_having_docs_passes(
        self, mock_get_docs, mock_get_required
    ):
        """Items in VERIFIED status pass if they have document submissions."""
        mock_get_docs.return_value = [_make_submission()]
        item = _make_item(
            status="VERIFIED",
            submissions=[_make_submission()],
        )
        mock_get_required.return_value = [item]
        package = _make_package()
        # Should not raise
        PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_package_with_no_documents_blocks(self, mock_get_docs):
        """Package without any documents blocks submission."""
        mock_get_docs.return_value = []
        package = _make_package()
        with pytest.raises(BadRequestError, match="at least one file"):
            PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_required_item_without_documents_blocks(
        self, mock_get_docs, mock_get_required
    ):
        """Required item with no document submissions blocks."""
        mock_get_docs.return_value = [_make_submission()]
        item = _make_item(submissions=[])  # No submissions
        mock_get_required.return_value = [item]
        package = _make_package()
        with pytest.raises(BadRequestError, match="at least one document"):
            PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_required_item_with_only_deleted_documents_blocks(
        self, mock_get_docs, mock_get_required
    ):
        """Required item where all documents are deleted blocks."""
        mock_get_docs.return_value = [_make_submission()]
        item = _make_item(
            submissions=[_make_submission(deleted=True)],
        )
        mock_get_required.return_value = [item]
        package = _make_package()
        with pytest.raises(BadRequestError, match="at least one document"):
            PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_required_item_with_form_only_blocks(
        self, mock_get_docs, mock_get_required
    ):
        """Required DOCUMENT_UPLOAD item with only form submission (no documents) blocks."""
        mock_get_docs.return_value = [_make_submission()]
        form_sub = _make_submission(submission_type=SubmissionType.FORM, doc_id=None, form_id=1)
        item = _make_item(submissions=[form_sub])
        mock_get_required.return_value = [item]
        package = _make_package()
        with pytest.raises(BadRequestError, match="at least one document"):
            PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_form_submission_items_not_checked_for_documents(
        self, mock_get_docs, mock_get_required
    ):
        """Required FORM_SUBMISSION items pass without documents."""
        mock_get_docs.return_value = [_make_submission()]
        form_sub = _make_submission(submission_type=SubmissionType.FORM, doc_id=None, form_id=1)
        item = _make_item(
            submissions=[form_sub],
            submission_method=SubmissionMethod.FORM_SUBMISSION,
        )
        mock_get_required.return_value = [item]
        package = _make_package()
        # Should not raise - form items don't need documents
        PackageService._validate_completeness(package)


class TestNewVersionAfterFailedReview:
    """Rule 5: New version after failed MP review goes through first-submission path.

    The new version has submitted_on=None, so _get_and_validate_complete_package
    routes to _validate_completeness (not resubmit).
    """

    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_new_version_no_documents_blocks(self, mock_get_docs):
        """Fresh package version with no documents blocks."""
        mock_get_docs.return_value = []
        package = _make_package(submitted_on=None)
        with pytest.raises(BadRequestError, match="at least one file"):
            PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_new_version_required_items_without_documents_blocks(
        self, mock_get_docs, mock_get_required
    ):
        """Fresh version with package docs but required items missing documents blocks."""
        mock_get_docs.return_value = [_make_submission()]
        item = _make_item(submissions=[])  # Required item with no docs
        mock_get_required.return_value = [item]
        package = _make_package(submitted_on=None)
        with pytest.raises(BadRequestError, match="at least one document"):
            PackageService._validate_completeness(package)

    @patch.object(PackageService, "_get_required_items")
    @patch.object(PackageService, "_get_document_submissions_from_package")
    def test_new_version_all_required_items_have_docs_passes(
        self, mock_get_docs, mock_get_required
    ):
        """Fresh version with all required items having documents passes."""
        mock_get_docs.return_value = [_make_submission()]
        item = _make_item(submissions=[_make_submission()])
        mock_get_required.return_value = [item]
        package = _make_package(submitted_on=None)
        # Should not raise
        PackageService._validate_completeness(package)
