"""Submission review management service."""
from collections import defaultdict

from flask import current_app

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import UnprocessableEntityError, ResourceNotFoundError
from submit_api.models import Item as ItemModel
from submit_api.models import Package as PackageModel
from submit_api.models import SubmissionReviewEntry
from submit_api.models.db import session_scope
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.queries.package import PackageQueries
from submit_api.models.submission import SubmissionStatus
from submit_api.models.submission_review import SubmissionReview, SubmissionReviewStatus
from submit_api.models.submission_review_entry import SubmissionReviewEntryType
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.services.consultation_record_service import ConsultationRecordService
from submit_api.services.management_plan_service import ManagementPlanService
from submit_api.utils.token_info import TokenInfo


class SubmissionReviewService:
    """Submission review management service."""

    @staticmethod
    def _unsupported_submission_item_type(*args, **kwargs):  # pylint: disable=unused-argument
        """Unset submission item type."""
        current_app.logger.error("Attempted to use an unsupported item type.")
        raise UnprocessableEntityError("Item type is not supported.")

    @staticmethod
    def _unsupported_submission_review_status(*args, **kwargs):  # pylint: disable=unused-argument
        """Unset submission item review status."""
        current_app.logger.error("Attempted to use an unsupported review status.")
        raise UnprocessableEntityError("Status is not supported.")

    @staticmethod
    def _update_package_status(package_id, session):
        """Update the status of the package based on the statuses of its items."""
        PackageQueries.update_package_status(package_id, session)
        current_app.logger.info(f"Package status updated for package ID: {package_id}")

    @staticmethod
    def _update_item_submissions_status(status, session, item=None, item_id=None):
        """Update the status of the package based on the statuses of its items."""
        if not item_id and not item:
            current_app.logger.error("Item ID or item is required.")
            raise UnprocessableEntityError("Item ID or item is required.")
        if not item:
            item = ItemModel.find_by_id(item_id)
        submissions = item.submissions
        for submission in submissions:
            submission.status = status
            session.add(submission)
        current_app.logger.info(f"Submissions status updated for item ID: {item_id} to {status}")

    @classmethod
    def _get_submission_item_by_id(cls, item_id) -> ItemModel:
        """Get item by id."""
        item = ItemModel.find_by_id(item_id)
        if not item:
            current_app.logger.warning(f"Item with id {item_id} not found.")
            raise ResourceNotFoundError(f"Item with id {item_id} not found.")
        return item

    @classmethod
    def get_or_create_active_item_review(cls, item_id) -> SubmissionReview:
        """Get item by id."""
        _ = cls._get_submission_item_by_id(item_id)
        review = SubmissionReview.get_active_review_by_item_id(item_id)
        if not review:
            review = SubmissionReview(item_id=item_id)
        current_app.logger.debug(f"Active item review for item {item_id}: {review}")
        return review

    @classmethod
    def get_or_create_active_item_review_entry(cls, review_id, entry_type) -> SubmissionReview:
        """Get or create item review entry."""
        if entry_type not in SubmissionReviewEntryType.__members__:
            current_app.logger.error(f"Unsupported review entry type: {entry_type}")
            raise UnprocessableEntityError("Review entry type is not supported.")
        review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(review_id, entry_type)
        if not review_entry:
            review_entry = SubmissionReviewEntry(review_id=review_id, type=entry_type)
        return review_entry

    @classmethod
    def _save_submission_review_answers(cls, review, review_data, session):
        """Save submission item review answers."""
        review_type = review_data.get('type')
        if not review_type:
            current_app.logger.error("Review type is required.")
            raise UnprocessableEntityError("Review type is required.")

        form_answers = review_data.get('form_answers', {})
        review_entry = cls.get_or_create_active_item_review_entry(review.id, review_type)
        review_entry.entry = form_answers
        review_entry.updated_by = TokenInfo.get_id()
        session.add(review_entry)
        session.flush()
        current_app.logger.debug(f"Submission review answers saved for review {review.id}.")
        return review

    @classmethod
    def process_review_status(cls, review, status, session):
        """Process review status."""
        if not status:
            return review
        if status not in SubmissionReviewStatus.__members__:
            current_app.logger.error(f"Unsupported review status: {status}")
            raise UnprocessableEntityError("Status is not supported.")
        review.status = status
        cls.submission_item_post_review(review, session)
        current_app.logger.info(f"Review status processed for review {review.id}: {status}")
        return review

    @classmethod
    def submission_item_post_review(cls, review, session):
        """Post review of submission item."""
        if review.status == SubmissionReviewStatus.APPROVED.value:
            cls.approve_submission(review.item_id, session)
        elif review.status == SubmissionReviewStatus.REJECTED.value:
            cls.reject_submission(review.item_id, session)
        elif review.status == SubmissionReviewStatus.PENDING_MANAGER_REVIEW.value:
            cls.send_recommendation_to_manager(review.item_id, session)

    @classmethod
    def send_recommendation_to_manager(cls, item_id, session):
        """Send recommendation to manager."""
        item = cls._get_submission_item_by_id(item_id)
        item.status = ItemStatus.AWAITING_MANAGER_REVIEW
        cls._update_package_status(item.package_id, session)
        current_app.logger.info(f"Recommendation sent to manager for item {item_id}.")
        return item

    @classmethod
    def save_submission_review(cls, item_id, review_data):
        """Save submission item review."""
        with session_scope() as session:
            review = cls.get_or_create_active_item_review(item_id)
            review.flush()
            item = ItemModel.find_by_id(item_id)
            package = PackageModel.find_by_id(item.package_id)
            if not package.submitted_on:
                current_app.logger.error(f"Package {package.id} has not been submitted.")
                raise UnprocessableEntityError("Package has not been submitted.")

            if review.status == SubmissionReviewStatus.APPROVED:
                current_app.logger.error(f"Item {item_id} already approved.")
                raise UnprocessableEntityError("Item has already been approved.")
            if package.completed_on:
                current_app.logger.error(f"Package {package.id} has already been completed.")
                raise UnprocessableEntityError("Package has already been completed.")
            cls._save_submission_review_answers(review, review_data, session)
            status = review_data.get('status')
            cls.process_review_status(review, status, session)
            session.add(review)
            current_app.logger.info(f"Submission review saved for item {item_id}.")
            return review

    @classmethod
    def _get_submission_item_approval_processor(cls, item: ItemModel) -> callable:
        """Get submission item approval processor."""
        item_type = item.type.name
        status_processor_map = defaultdict(
            lambda: cls._unsupported_submission_item_type,
            {
                SubmissionItemType.CONSULTATION_RECORD.value: ConsultationRecordService.approve_consultation_record,
                SubmissionItemType.MANAGEMENT_PLAN_FORM.value: ManagementPlanService.approve_management_plan,
            }
        )
        current_app.logger.debug(f"Approval processor retrieved for item {item.id} of type {item_type}")
        return status_processor_map[item_type]

    @classmethod
    def approve_submission(cls, item_id, session):
        """Approve submission."""
        item = cls._get_submission_item_by_id(item_id)
        approval_processor = cls._get_submission_item_approval_processor(item)
        approval_processor(item, session)
        cls._update_package_status(item.package_id, session)
        cls._update_item_submissions_status(SubmissionStatus.APPROVED, session, item=item)
        current_app.logger.info(f"Submission item {item.id} approved.")
        return item

    @classmethod
    def reject_submission(cls, item_id, session):
        """Reject submission item."""
        item = ItemModel.find_by_id(item_id)
        rejection_processor = cls._get_submission_item_rejection_processor(item)
        rejection_processor(item, session)
        cls._update_package_status(item.package_id, session)
        cls._update_item_submissions_status(SubmissionStatus.REJECTED, session, item=item)
        current_app.logger.info(f"Submission item {item.id} rejected.")
        return item

    @classmethod
    def _get_submission_item_rejection_processor(cls, item: ItemModel) -> callable:
        """Get submission item rejection processor."""
        item_type = item.type.name
        status_processor_map = defaultdict(
            lambda: cls._unsupported_submission_item_type,
            {
                SubmissionItemType.MANAGEMENT_PLAN_FORM.value: ManagementPlanService.reject_management_plan_form,
                SubmissionItemType.CONSULTATION_RECORD.value: ConsultationRecordService.reject_consultation_record,
            }
        )
        current_app.logger.debug(f"Rejection processor retrieved for item {item.id} of type {item_type}")
        return status_processor_map[item_type]

    @staticmethod
    def _log_activity_mp_review(item, action, session):
        """Log activity for approving or rejecting the Management Plan review."""
        package = PackageModel.find_by_id(item.package_id)
        ActivityLogService.log_activity(
            entity_id=package.id,
            action=action,
            entity_version=package.version.version,
            session=session
        )
