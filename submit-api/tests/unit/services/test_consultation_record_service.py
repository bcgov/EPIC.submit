"""Unit tests for ConsultationRecordService."""
from unittest.mock import Mock, patch, MagicMock

import pytest

MODULE = "submit_api.services.consultation_record_service"


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Patch current_app so the service's logger calls work without an app context."""
    with patch(f"{MODULE}.current_app", new=Mock()):
        yield


def _mock_item(package_id=1, item_id=10):
    """Build a mock item."""
    item = Mock()
    item.id = item_id
    item.package_id = package_id
    item.type = Mock()
    item.type.name = "CONSULTATION_RECORD"
    return item


def _mock_package(package_id=1, update_requests=None):
    """Build a mock package with version info."""
    package = Mock()
    package.id = package_id
    package.version = Mock()
    package.version.original_package_id = 100
    package.version.version = 1
    package.update_requests = update_requests or []
    return package


def _mock_review_entry(entry_data):
    """Build a mock SubmissionReviewEntry with given entry data."""
    entry = Mock()
    entry.entry = entry_data
    return entry


class TestRejectConsultationRecord:
    """Tests for reject_consultation_record."""

    @patch(f"{MODULE}.SubmitEmailQueueService")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.Package")
    @patch(f"{MODULE}.TokenInfo")
    @patch(f"{MODULE}.SubmissionReviewEntry")
    @patch(f"{MODULE}.SubmissionReview")
    def test_reject_creates_one_update_request_per_section(
        self,
        mock_review_cls,
        mock_entry_cls,
        mock_token_info,
        mock_package_cls,
        mock_activity_log,
        mock_email_service,
    ):
        """Rejecting CC with section_notes creates one UpdateRequest per section."""
        from submit_api.services.consultation_record_service import ConsultationRecordService

        item = _mock_item()
        session = MagicMock()

        mock_review = Mock()
        mock_review.id = 1
        mock_review_cls.get_active_review_by_item_id.return_value = mock_review

        mock_entry_cls.get_review_entry_by_id_and_type.return_value = _mock_review_entry({
            'passedConsultationCheck': 'NO',
            'section_notes': {
                '2': 'Note for Consultation Check',
                '3': 'Note for Management Plan',
            },
            'submission_item_types': [2, 3],
        })

        mock_token_info.get_username.return_value = 'test-user'
        mock_package_cls.find_by_id.return_value = _mock_package()

        ConsultationRecordService.reject_consultation_record(item, session)

        # Should create 2 update requests (one per section)
        assert session.add.call_count >= 2
        added_objects = [call.args[0] for call in session.add.call_args_list]
        from submit_api.models.update_request import UpdateRequest
        update_requests = [obj for obj in added_objects if isinstance(obj, UpdateRequest)]
        assert len(update_requests) == 2

        # Verify first request
        assert update_requests[0].submission_item_types == [2]
        assert update_requests[0].reason == 'Note for Consultation Check'

        # Verify second request
        assert update_requests[1].submission_item_types == [3]
        assert update_requests[1].reason == 'Note for Management Plan'

    @patch(f"{MODULE}.SubmitEmailQueueService")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.Package")
    @patch(f"{MODULE}.TokenInfo")
    @patch(f"{MODULE}.SubmissionReviewEntry")
    @patch(f"{MODULE}.SubmissionReview")
    def test_reject_sends_one_email(
        self,
        mock_review_cls,
        mock_entry_cls,
        mock_token_info,
        mock_package_cls,
        mock_activity_log,
        mock_email_service,
    ):
        """Rejecting CC sends exactly one email regardless of section count."""
        from submit_api.services.consultation_record_service import ConsultationRecordService

        item = _mock_item()
        session = MagicMock()

        mock_review = Mock()
        mock_review.id = 1
        mock_review_cls.get_active_review_by_item_id.return_value = mock_review

        mock_entry_cls.get_review_entry_by_id_and_type.return_value = _mock_review_entry({
            'passedConsultationCheck': 'NO',
            'section_notes': {
                '2': 'Note for CC',
                '3': 'Note for MP',
            },
            'submission_item_types': [2, 3],
        })

        mock_token_info.get_username.return_value = 'test-user'
        mock_package_cls.find_by_id.return_value = _mock_package()

        ConsultationRecordService.reject_consultation_record(item, session)

        mock_email_service.queue_package_email.assert_called_once()

    @patch(f"{MODULE}.SubmitEmailQueueService")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.Package")
    @patch(f"{MODULE}.TokenInfo")
    @patch(f"{MODULE}.SubmissionReviewEntry")
    @patch(f"{MODULE}.SubmissionReview")
    def test_reject_falls_back_to_old_format(
        self,
        mock_review_cls,
        mock_entry_cls,
        mock_token_info,
        mock_package_cls,
        mock_activity_log,
        mock_email_service,
    ):
        """Rejecting CC with old format (reason + submission_item_types) still works."""
        from submit_api.services.consultation_record_service import ConsultationRecordService

        item = _mock_item()
        session = MagicMock()

        mock_review = Mock()
        mock_review.id = 1
        mock_review_cls.get_active_review_by_item_id.return_value = mock_review

        # Old format: no section_notes, just reason + submission_item_types
        mock_entry_cls.get_review_entry_by_id_and_type.return_value = _mock_review_entry({
            'passedConsultationCheck': 'NO',
            'reason': 'Old style reason',
            'submission_item_types': [2, 3],
        })

        mock_token_info.get_username.return_value = 'test-user'
        mock_package_cls.find_by_id.return_value = _mock_package()

        ConsultationRecordService.reject_consultation_record(item, session)

        # Should create 1 update request (old format)
        added_objects = [call.args[0] for call in session.add.call_args_list]
        from submit_api.models.update_request import UpdateRequest
        update_requests = [obj for obj in added_objects if isinstance(obj, UpdateRequest)]
        assert len(update_requests) == 1
        assert update_requests[0].submission_item_types == [2, 3]
        assert update_requests[0].reason == 'Old style reason'

    @patch(f"{MODULE}.SubmitEmailQueueService")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.Package")
    @patch(f"{MODULE}.TokenInfo")
    @patch(f"{MODULE}.SubmissionReviewEntry")
    @patch(f"{MODULE}.SubmissionReview")
    def test_reject_sets_item_status_to_under_consultation_check(
        self,
        mock_review_cls,
        mock_entry_cls,
        mock_token_info,
        mock_package_cls,
        mock_activity_log,
        mock_email_service,
    ):
        """Rejecting CC sets item status back to UNDER_CONSULTATION_CHECK."""
        from submit_api.services.consultation_record_service import ConsultationRecordService
        from submit_api.enums.item_status import ItemStatus

        item = _mock_item()
        session = MagicMock()

        mock_review = Mock()
        mock_review.id = 1
        mock_review_cls.get_active_review_by_item_id.return_value = mock_review

        mock_entry_cls.get_review_entry_by_id_and_type.return_value = _mock_review_entry({
            'passedConsultationCheck': 'NO',
            'section_notes': {'2': 'Note'},
            'submission_item_types': [2],
        })

        mock_token_info.get_username.return_value = 'test-user'
        mock_package_cls.find_by_id.return_value = _mock_package()

        ConsultationRecordService.reject_consultation_record(item, session)

        assert item.status == ItemStatus.UNDER_CONSULTATION_CHECK.value


class TestApproveConsultationRecord:
    """Tests for approve_consultation_record."""

    @patch(f"{MODULE}.PackageService")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    @patch(f"{MODULE}.Package")
    @patch(f"{MODULE}.TokenInfo")
    @patch(f"{MODULE}.SubmissionReviewEntry")
    @patch(f"{MODULE}.SubmissionReview")
    def test_approve_closes_existing_review_requests(
        self,
        mock_review_cls,
        mock_entry_cls,
        mock_token_info,
        mock_package_cls,
        mock_metadata_cls,
        mock_activity_log,
        mock_package_service,
    ):
        """Approving CC closes active REVIEW-type update requests."""
        from submit_api.services.consultation_record_service import ConsultationRecordService
        from submit_api.models.update_request import UpdateRequestType, UpdateRequestStatus

        item = _mock_item()
        session = MagicMock()

        mock_review = Mock()
        mock_review.id = 1
        mock_review_cls.get_active_review_by_item_id.return_value = mock_review

        mock_entry_cls.get_review_entry_by_id_and_type.return_value = _mock_review_entry({
            'passedConsultationCheck': 'YES',
        })

        mock_token_info.get_username.return_value = 'test-user'

        # Create mock REVIEW-type update requests
        review_request_1 = Mock()
        review_request_1.type = UpdateRequestType.REVIEW
        review_request_1.active = True
        review_request_1.status = 'OPEN'

        review_request_2 = Mock()
        review_request_2.type = UpdateRequestType.REVIEW
        review_request_2.active = True
        review_request_2.status = 'PENDING_REVIEW'

        package = _mock_package(update_requests=[review_request_1, review_request_2])
        mock_package_cls.find_by_id.return_value = package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_metadata_cls.get_or_create.return_value = mock_metadata

        ConsultationRecordService.approve_consultation_record(item, session)

        # Both review requests should be closed
        assert review_request_1.status == UpdateRequestStatus.CLOSED.value
        assert review_request_1.active is False
        assert review_request_2.status == UpdateRequestStatus.CLOSED.value
        assert review_request_2.active is False

    @patch(f"{MODULE}.PackageService")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    @patch(f"{MODULE}.Package")
    @patch(f"{MODULE}.TokenInfo")
    @patch(f"{MODULE}.SubmissionReviewEntry")
    @patch(f"{MODULE}.SubmissionReview")
    def test_approve_with_no_existing_requests(
        self,
        mock_review_cls,
        mock_entry_cls,
        mock_token_info,
        mock_package_cls,
        mock_metadata_cls,
        mock_activity_log,
        mock_package_service,
    ):
        """Approving CC with no existing REVIEW requests does not error."""
        from submit_api.services.consultation_record_service import ConsultationRecordService

        item = _mock_item()
        session = MagicMock()

        mock_review = Mock()
        mock_review.id = 1
        mock_review_cls.get_active_review_by_item_id.return_value = mock_review

        mock_entry_cls.get_review_entry_by_id_and_type.return_value = _mock_review_entry({
            'passedConsultationCheck': 'YES',
        })

        mock_token_info.get_username.return_value = 'test-user'

        package = _mock_package(update_requests=[])
        mock_package_cls.find_by_id.return_value = package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_metadata_cls.get_or_create.return_value = mock_metadata

        # Should not raise
        ConsultationRecordService.approve_consultation_record(item, session)

    @patch(f"{MODULE}.PackageService")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    @patch(f"{MODULE}.Package")
    @patch(f"{MODULE}.TokenInfo")
    @patch(f"{MODULE}.SubmissionReviewEntry")
    @patch(f"{MODULE}.SubmissionReview")
    def test_approve_does_not_close_update_type_requests(
        self,
        mock_review_cls,
        mock_entry_cls,
        mock_token_info,
        mock_package_cls,
        mock_metadata_cls,
        mock_activity_log,
        mock_package_service,
    ):
        """Approving CC does not close UPDATE-type requests, only REVIEW-type."""
        from submit_api.services.consultation_record_service import ConsultationRecordService
        from submit_api.models.update_request import UpdateRequestType

        item = _mock_item()
        session = MagicMock()

        mock_review = Mock()
        mock_review.id = 1
        mock_review_cls.get_active_review_by_item_id.return_value = mock_review

        mock_entry_cls.get_review_entry_by_id_and_type.return_value = _mock_review_entry({
            'passedConsultationCheck': 'YES',
        })

        mock_token_info.get_username.return_value = 'test-user'

        # Create an UPDATE-type request that should NOT be closed
        update_request = Mock()
        update_request.type = UpdateRequestType.UPDATE
        update_request.active = True
        update_request.status = 'OPEN'

        package = _mock_package(update_requests=[update_request])
        mock_package_cls.find_by_id.return_value = package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_metadata_cls.get_or_create.return_value = mock_metadata

        ConsultationRecordService.approve_consultation_record(item, session)

        # UPDATE-type request should NOT be modified
        assert update_request.status == 'OPEN'
        assert update_request.active is True
