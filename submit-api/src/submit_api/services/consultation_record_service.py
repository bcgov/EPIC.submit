"""Consultation record review service."""
from datetime import datetime

from flask import current_app

from submit_api.enums.activity_type import ActivityActionType
from submit_api.enums.item_status import ItemStatus
from submit_api.models import UpdateRequest
from submit_api.models import PackageMetadata, SubmissionReviewEntry
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.submission import SubmissionStatus
from submit_api.models.submission_review import SubmissionReview
from submit_api.models.submission_review_entry import SubmissionReviewEntryType
from submit_api.models.update_request import UpdateRequestType
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.services.package import PackageService
from submit_api.utils.token_info import TokenInfo


class ConsultationRecordService:
    """Consultation record review service."""

    @classmethod
    def approve_consultation_record(cls, item, session):
        """Approve consultation record."""
        item.status = ItemStatus.PASSED_CONSULTATION_CHECK.value
        reviewed_on = datetime.utcnow()
        item.reviewed_on = reviewed_on
        package_metadata = PackageMetadata.get_by_package_id(item.package_id)
        if not package_metadata:
            package_metadata = PackageMetadata(package_id=item.package_id, json={})
        existing_json = package_metadata.json if package_metadata.json else {}
        package_metadata.json = {
            **existing_json,
            PackageMetadataFields.CONSULTATION_CHECK_COMPLETED_ON.value: reviewed_on.isoformat(),
        }
        session.add(item)
        session.add(package_metadata)
        cls._log_activity_consultation_check(item, session, success=True)
        current_app.logger.info(f"Consultation record approved for item {item.id}.")

        current_app.logger.info(f"Starting MP review for package {item.package_id}.")
        PackageService.start_mp_review(item.package_id, session)
        current_app.logger.info(f"MP review started for package {item.package_id}.")

        return item

    @staticmethod
    def _log_activity_consultation_check(item, session, success=True):
        """Log activity for passing or failing the consultation check."""
        action_type = (
            ActivityActionType.PASSED_CONSULTATION_CHECK.value
            if success else
            ActivityActionType.FAILED_CONSULTATION_CHECK.value
        )

        ActivityLogService.log_activity(
            entity_id=item.id,
            action=action_type,
            entity_version=item.package.version_id,
            actor_id= TokenInfo.get_id(),
            session=session
        )

    @classmethod
    def reject_consultation_record(cls, item, session):
        """Reject consultation record."""
        cls._update_submissions_status(item, SubmissionStatus.REJECTED, session)
        update_request_data = cls._prepare_update_request_data(item)
        cls._create_update_request(update_request_data, session)
        cls._log_activity_consultation_check(item, session, success=False)
        session.flush()
        return item

    @classmethod
    def _update_submissions_status(cls, item, status, session):
        """Update the status of submissions."""
        for submission in item.submissions:
            submission.status = status
            session.add(submission)

    @classmethod
    def _prepare_update_request_data(cls, item):
        """Prepare the update request data."""
        item_review = SubmissionReview.get_active_review_by_item_id(item.id)
        manager_review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(
            item_review.id, SubmissionReviewEntryType.MANAGER_CONFIRMATION
        )
        return {
            'package_id': item.package_id,
            'item_ids': manager_review_entry.entry.get('submission_item_ids') if manager_review_entry else None,
            'reason': manager_review_entry.entry.get('reason') if manager_review_entry else None,
            'type': UpdateRequestType.REVIEW,
        }

    @classmethod
    def _create_update_request(cls, data, session):
        """Create an update request."""
        current_app.logger.info(f"Creating update request for new package {data.get('package_id')}.")
        update_request = UpdateRequest(
            submission_package_id=data.get('package_id'),
            submission_item_ids=data.get('item_ids'),
            created_by=TokenInfo.get_id(),
            reason=data.get('reason'),
            type=data.get('type')
        )
        session.add(update_request)
        current_app.logger.info(f"Update request created for new package {data.get('package_id')}.")
