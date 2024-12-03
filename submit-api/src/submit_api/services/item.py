"""Service for item management."""
from collections import defaultdict
from datetime import datetime

from flask import current_app

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import UnprocessableEntityError
from submit_api.models import Item as ItemModel, PackageMetadata
from submit_api.models.db import session_scope
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.queries.package import PackageQueries
from submit_api.models.submission_review import SubmissionReview, SubmissionReviewStatus


class ItemService:
    """Item management service."""

    @staticmethod
    def _apply_update_data(submission_item, update_data):
        """Apply update data to the submission item."""
        for key, value in update_data.items():
            setattr(submission_item, key, value)
        current_app.logger.debug(f"Updated submission item {submission_item.id} with data: {update_data}")

    @staticmethod
    def _unsupported_submission_item_type(*args, **kwargs):
        """Unset submission item type."""
        current_app.logger.error("Attempted to use an unsupported item type.")
        raise UnprocessableEntityError("Item type is not supported.")

    @staticmethod
    def _unsupported_submission_review_status(*args, **kwargs):
        """Unset submission item review status."""
        current_app.logger.error("Attempted to use an unsupported review status.")
        raise UnprocessableEntityError("Status is not supported.")

    @staticmethod
    def _update_package_status(package_id, session):
        """Update the status of the package based on the statuses of its items."""
        PackageQueries.update_package_status(package_id, session)
        current_app.logger.info(f"Package status updated for package ID: {package_id}")

    @classmethod
    def get_item_by_id(cls, item_id) -> ItemModel:
        """Get item by id."""
        item = ItemModel.find_by_id(item_id)
        if not item:
            current_app.logger.warning(f"Item with id {item_id} not found.")
            raise ValueError(f"Item with id {item_id} not found.")
        return item

    @classmethod
    def update_submission_item(cls, item_id, update_data):
        """Update submission item by id."""
        submission_item = cls.get_item_by_id(item_id)
        if not submission_item:
            current_app.logger.warning(f"Item with id {item_id} not found.")
            raise ValueError(f"Item with id {item_id} not found.")

        existing_status = submission_item.status
        with session_scope() as session:
            cls._apply_update_data(submission_item, update_data)
            session.add(submission_item)
            session.flush()

            if 'status' in update_data and existing_status != update_data['status']:
                cls._update_package_status(submission_item.package_id, session)

            session.commit()
        current_app.logger.info(f"Submission item {submission_item.id} updated successfully.")
        return submission_item

    @classmethod
    def get_or_create_active_item_review(cls, item_id) -> SubmissionReview:
        """Get item by id."""
        _ = cls.get_item_by_id(item_id)
        review = SubmissionReview.get_active_review_by_item_id(item_id)
        if not review:
            review = SubmissionReview(item_id=item_id)
        current_app.logger.debug(f"Active item review for item {item_id}: {review}")
        return review

    @classmethod
    def _save_submission_review_answers(cls, review, review_data):
        """Save submission item review answers."""
        form_answers = review_data.get('form_answers', {})

        current_form_answers = review.form_answers if review.form_answers else {}
        review.form_answers = {
            **current_form_answers,
            **form_answers,
        }
        current_app.logger.debug(f"Review answers saved for review {review.id}: {review.form_answers}")
        return review

    @classmethod
    def process_review_status(cls, review, status, session):
        """Process review status."""
        if not status:
            return
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
            return cls.approve_submission_item(review.item_id, session)

    @classmethod
    def save_submission_review(cls, item_id, review_data):
        """Save submission item review."""
        review = cls.get_or_create_active_item_review(item_id)

        if review.status == SubmissionReviewStatus.APPROVED.value:
            current_app.logger.error(f"Item {item_id} already approved.")
            raise UnprocessableEntityError("Item has already been approved.")

        with session_scope() as session:
            cls._save_submission_review_answers(review, review_data)
            status = review_data.get('status')
            cls.process_review_status(review, status, session)
            session.add(review)
            session.flush()
            session.commit()
        current_app.logger.info(f"Submission review saved for item {item_id}.")
        return review

    @classmethod
    def _get_submission_item_approval_processor(cls, item: ItemModel) -> callable:
        """Get submission item approval processor."""
        item_type = item.type
        status_processor_map = defaultdict(
            lambda: cls._unsupported_submission_item_type,
            {
                SubmissionItemType.CONSULTATION_RECORD.value: cls.approve_consultation_record,
            }
        )
        current_app.logger.debug(f"Approval processor retrieved for item {item.id}: {status_processor_map[item_type]}")
        return status_processor_map[item_type]

    @classmethod
    def approve_submission_item(cls, item_id, session):
        """Approve submission item."""
        item = cls.get_item_by_id(item_id)
        approval_processor = cls._get_submission_item_approval_processor(item)
        approval_processor(item, session)
        cls._update_package_status(item.package_id, session)
        current_app.logger.info(f"Submission item {item.id} approved.")
        return item

    @classmethod
    def approve_consultation_record(cls, item, session):
        """Approve consultation record."""
        item.status = ItemStatus.PASSED_CONSULTATION_CHECK.value
        reviewed_on = datetime.utcnow()
        item.reviewed_on = reviewed_on
        package_metadata = PackageMetadata.get_by_package_id(item.package_id)
        package_metadata.json[PackageMetadataFields.CONSULTATION_CHECK_COMPLETED_ON.value] = reviewed_on
        session.add(item)
        session.add(package_metadata)
        current_app.logger.info(f"Consultation record approved for item {item.id}.")

        return item

