"""Service for item management."""
from collections import defaultdict

from submit_api.exceptions import UnprocessableEntityError
from submit_api.models import Item as ItemModel
from submit_api.models.db import session_scope
from submit_api.models.queries.package import PackageQueries
from submit_api.models.submission_review import SubmissionReview, SubmissionReviewStatus


class ItemService:
    """Item management service."""

    @classmethod
    def get_item_by_id(cls, item_id) -> ItemModel:
        """Get item by id."""
        item = cls.get_item_by_id(item_id)
        if not item:
            raise ValueError(f"Item with id {item_id} not found.")
        return item

    @staticmethod
    def _apply_update_data(submission_item, update_data):
        """Apply update data to the submission item."""
        for key, value in update_data.items():
            setattr(submission_item, key, value)

    @staticmethod
    def _update_package_status(package_id, session):
        """Update the status of the package based on the statuses of its items."""
        PackageQueries.update_package_status(package_id, session)

    @classmethod
    def update_submission_item(cls, item_id, update_data):
        """Update submission item by id."""
        submission_item = cls.get_item_by_id(item_id)
        if not submission_item:
            raise ValueError(f"Item with id {item_id} not found.")

        existing_status = submission_item.status
        with session_scope() as session:
            cls._apply_update_data(submission_item, update_data)
            session.add(submission_item)
            session.flush()

            if 'status' in update_data and existing_status != update_data['status']:
                cls._update_package_status(submission_item.package_id, session)

            session.commit()

        return submission_item

    @classmethod
    def get_or_create_active_item_review(cls, item_id) -> SubmissionReview:
        """Get item by id."""
        _ = cls.get_item_by_id(item_id)
        review = SubmissionReview.get_by_item_id(item_id)
        if not review:
            review = SubmissionReview(item_id=item_id)
        return review

    @classmethod
    def _save_submission_review_answers(cls, review, review_data):
        """Save submission item review answers."""
        form_answers = review_data.get('form_answers', {})
        review.form_answers.update(form_answers)
        return review

    @classmethod
    def _save_submission_review_status(cls, review, status):
        """Save submission item review status."""
        review.status = status
        return review

    @staticmethod
    def _unsupported_submission_review_status(*args, **kwargs):
        """Unset submission item review status."""
        raise UnprocessableEntityError("Status is not supported.")

    @classmethod
    def _get_review_status_processor(cls, status) -> callable:
        """Get review status processor."""
        status_processor_map = defaultdict(
            lambda: cls._unsupported_submission_review_status,
            {
                SubmissionReviewStatus.PENDING_STAFF_REVIEW.value: cls._save_submission_review_status,
                SubmissionReviewStatus.PENDING_MANAGER_REVIEW.value: cls._save_submission_review_status,
            }
        )
        return status_processor_map[status]

    @classmethod
    def process_review_status(cls, review, status, session):
        """Process review status."""
        if not status:
            return
        status_processor = cls._get_review_status_processor(status)
        status_processor(review, status)
        session.add(review)

    @classmethod
    def save_submission_review(cls, item_id, review_data):
        """Save submission item review."""
        review = cls.get_or_create_active_item_review(item_id)

        with session_scope() as session:
            cls._save_submission_review_answers(review, review_data)
            cls.process_review_status(review, review_data['status'], session)
            session.add(review)
            session.commit()
            return review
