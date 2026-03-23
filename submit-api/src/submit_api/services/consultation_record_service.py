"""Consultation record review service."""
from datetime import datetime, UTC

from flask import current_app

from submit_api.enums.activity_type import ActivityActionType
from submit_api.enums.item_status import ItemStatus
from submit_api.models import UpdateRequest, Package
from submit_api.models import PackageMetadata, SubmissionReviewEntry
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.submission_review import SubmissionReview
from submit_api.models.submission_review_entry import SubmissionReviewEntryType
from submit_api.models.update_request import UpdateRequestType
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.services.package import PackageService
from submit_api.utils.token_info import TokenInfo
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.utils.constants import (
    MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE)


class ConsultationRecordService:
    """Consultation record review service."""

    @classmethod
    def approve_consultation_record(cls, item, session):
        """Approve consultation record."""
        item.status = ItemStatus.PASSED_CONSULTATION_CHECK.value
        reviewed_on = datetime.now(UTC)
        item.reviewed_on = reviewed_on
        package_metadata = PackageMetadata.get_by_package_id(item.package_id)
        if not package_metadata:
            package_metadata = PackageMetadata(
                package_id=item.package_id, json={})
        existing_json = package_metadata.json if package_metadata.json else {}
        package_metadata.json = {
            **existing_json,
            PackageMetadataFields.CONSULTATION_CHECK_COMPLETED_ON.value: reviewed_on.isoformat(),
        }
        session.add(item)
        session.add(package_metadata)
        package = Package.find_by_id(item.package_id)
        ActivityLogService.log_activity(
            entity_id=package.version.original_package_id,
            action=ActivityActionType.PASSED_CONSULTATION_CHECK.value,
            entity_version=package.version.version,
            actor_id=TokenInfo.get_username(),
            session=session
        )
        current_app.logger.info(
            f"Consultation record approved for item {item.id}.")

        current_app.logger.info(
            f"Starting MP review for package {item.package_id}.")
        PackageService.start_review(item.package_id, session)
        current_app.logger.info(
            f"MP review started for package {item.package_id}.")

        return item

    @classmethod
    def reject_consultation_record(cls, item, session):
        """Reject consultation record."""
        update_request_data = cls._prepare_update_request_data(item)
        cls._create_update_request(update_request_data, session)
        package = Package.find_by_id(item.package_id)
        ActivityLogService.log_activity(
            entity_id=package.version.original_package_id,
            action=ActivityActionType.FAILED_CONSULTATION_CHECK.value,
            entity_version=package.version.version,
            actor_id=TokenInfo.get_username(),
            session=session
        )
        cls._create_rejection_email_queue(
            item.package_id, MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE)
        item.status = ItemStatus.UNDER_CONSULTATION_CHECK.value
        session.add(item)
        session.flush()
        return item

    @classmethod
    def _prepare_update_request_data(cls, item):
        """Prepare the update request data."""
        item_review = SubmissionReview.get_active_review_by_item_id(item.id)
        manager_review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(
            item_review.id, SubmissionReviewEntryType.MANAGER_CONFIRMATION
        )
        return {
            'package_id': item.package_id,
            'item_types': manager_review_entry.entry.get('submission_item_types') if manager_review_entry else None,
            'reason': manager_review_entry.entry.get('reason') if manager_review_entry else None,
            'type': UpdateRequestType.REVIEW,
        }

    @classmethod
    def _create_update_request(cls, data, session):
        """Create an update request."""
        current_app.logger.info(
            f"Creating update request for new package {data.get('package_id')}.")
        update_request = UpdateRequest(
            submission_package_id=data.get('package_id'),
            submission_item_types=data.get('item_types'),
            created_by=TokenInfo.get_username(),
            reason=data.get('reason'),
            type=data.get('type')
        )
        session.add(update_request)
        current_app.logger.info(
            f"Update request created for new package {data.get('package_id')}.")

    @classmethod
    def _create_rejection_email_queue(cls, package_id, template_name):
        """Create an email queue record for an update request."""
        email_queue = EmailQueueModel(
            entity_id=package_id, entity_type=EntityType.PACKAGE.value,
            template_name=template_name
        )
        email_queue.save()
