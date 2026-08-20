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
from submit_api.models.update_request import UpdateRequestType, UpdateRequestStatus
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.services.package_service import PackageService
from submit_api.utils.token_info import TokenInfo
from submit_api.services.email_queue_service import SubmitEmailQueueService
from submit_api.utils.constants import (
    MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE)


class ConsultationRecordService:
    """Consultation record review service."""

    @classmethod
    def approve_consultation_record(cls, item, session):
        """Approve consultation record."""
        item_review = SubmissionReview.get_active_review_by_item_id(item.id)
        manager_review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(
            item_review.id, SubmissionReviewEntryType.MANAGER_CONFIRMATION
        )
        is_not_applicable = False
        if manager_review_entry and manager_review_entry.entry:
            is_not_applicable = manager_review_entry.entry.get('passedConsultationCheck') == 'NOT_APPLICABLE'

        if is_not_applicable:
            item.status = ItemStatus.NOT_APPLICABLE.value
        else:
            item.status = ItemStatus.PASSED_CONSULTATION_CHECK.value

        reviewed_on = datetime.now(UTC)
        item.reviewed_on = reviewed_on
        package_metadata = PackageMetadata.get_or_create(item.package_id)
        existing_json = package_metadata.json if package_metadata.json else {}
        package_metadata.json = {
            **existing_json,
            PackageMetadataFields.CONSULTATION_CHECK_COMPLETED_ON.value: reviewed_on.isoformat(),
        }
        session.add(item)
        session.add(package_metadata)
        package = Package.find_by_id(item.package_id)
        if package.version:
            ActivityLogService.log_activity(
                entity_id=package.version.original_package_id,
                action=ActivityActionType.PASSED_CONSULTATION_CHECK.value,
                entity_version=package.version.version,
                actor_id=TokenInfo.get_username(),
                session=session
            )
        current_app.logger.info(
            f"Consultation record approved for item {item.id}.")

        # Close any active REVIEW-type update requests on this package
        cls._close_review_update_requests(package, session)

        current_app.logger.info(
            f"Starting MP review for package {item.package_id}.")
        PackageService.start_review(item.package_id, session)
        current_app.logger.info(
            f"MP review started for package {item.package_id}.")

        return item

    @classmethod
    def reject_consultation_record(cls, item, session):
        """Reject consultation record."""
        update_requests_data = cls._prepare_update_request_data(item)
        for request_data in update_requests_data:
            cls._create_update_request(request_data, session)
        package = Package.find_by_id(item.package_id)
        if package.version:
            ActivityLogService.log_activity(
                entity_id=package.version.original_package_id,
                action=ActivityActionType.FAILED_CONSULTATION_CHECK.value,
                entity_version=package.version.version,
                actor_id=TokenInfo.get_username(),
                session=session
            )
        cls._create_rejection_email_queue(
            item.package_id, MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE, session)
        item.status = ItemStatus.UNDER_CONSULTATION_CHECK.value
        session.add(item)
        session.flush()
        return item

    @classmethod
    def _prepare_update_request_data(cls, item):
        """Prepare per-section update request data from the manager review entry."""
        item_review = SubmissionReview.get_active_review_by_item_id(item.id)
        manager_review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(
            item_review.id, SubmissionReviewEntryType.MANAGER_CONFIRMATION
        )
        if not manager_review_entry or not manager_review_entry.entry:
            return []

        entry = manager_review_entry.entry
        section_notes = entry.get('section_notes')

        # New format: one UpdateRequest per section in section_notes
        if section_notes and isinstance(section_notes, dict):
            requests = []
            for type_id_str, note in section_notes.items():
                if note and str(note).strip():
                    requests.append({
                        'package_id': item.package_id,
                        'item_types': [int(type_id_str)],
                        'reason': note,
                        'type': UpdateRequestType.REVIEW,
                    })
            return requests

        # Backward compatibility: old format with reason + submission_item_types
        item_types = entry.get('submission_item_types')
        reason = entry.get('reason')
        if item_types:
            return [{
                'package_id': item.package_id,
                'item_types': item_types,
                'reason': reason,
                'type': UpdateRequestType.REVIEW,
            }]
        return []

    @classmethod
    def _create_update_request(cls, data, session):
        """Create an update request."""
        current_app.logger.info(
            f"Creating update request for package {data.get('package_id')}.")
        update_request = UpdateRequest()
        update_request.submission_package_id = data.get('package_id')
        update_request.submission_item_types = data.get('item_types')
        update_request.created_by = TokenInfo.get_username()
        update_request.reason = data.get('reason')
        update_request.type = data.get('type')
        session.add(update_request)
        current_app.logger.info(
            f"Update request created for package {data.get('package_id')}.")

    @classmethod
    def _create_rejection_email_queue(cls, package_id, template_name, session):
        """Create an email queue record for an update request."""
        SubmitEmailQueueService.queue_package_email(package_id, template_name, session=session)

    @classmethod
    def _close_review_update_requests(cls, package, session):
        """Close active REVIEW-type update requests when CC passes."""
        review_requests = [
            req for req in package.update_requests
            if req.type == UpdateRequestType.REVIEW and req.active
        ]
        for request in review_requests:
            request.status = UpdateRequestStatus.CLOSED.value
            request.active = False
            session.add(request)
        if review_requests:
            current_app.logger.info(
                f"Closed {len(review_requests)} REVIEW-type update requests "
                f"for package {package.id}.")
