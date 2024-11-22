"""Service for item management."""
from submit_api.enums.item_status import ItemStatus, is_completion_status
from submit_api.models import Item as ItemModel
from submit_api.models.db import session_scope
from submit_api.models.queries.package import PackageQueries
from submit_api.models.submission_review import SubmissionReview


class ItemService:
    """Item management service."""

    @classmethod
    def get_item_by_id(cls, item_id) -> ItemModel:
        """Get item by id."""
        return ItemModel.find_by_id(item_id)

    @classmethod
    def add_item_status(cls, item_id, status, item=None, session=None):
        """Add status to the item."""
        if not item:
            item = cls.get_item_by_id(item_id)

        if not item:
            raise ValueError(f"Item with id {item_id} not found.")

        statuses = item.statuses
        if is_completion_status(status):
            # clear all completion statuses
            statuses = [s for s in statuses if not is_completion_status(s.value)]
            statuses.append(status)
            item.statuses = statuses
        else:
            # clear statuses from that status
            statuses = [s for s in statuses if s.value != status]
            statuses.append(status)
            item.statuses = statuses

        if session:
            session.add(item)
            session.commit()
        else:
            item.save()

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
    def get_item_review(cls, item_id) -> SubmissionReview:
        """Get item by id."""
        return SubmissionReview.get_by_item_id(item_id)

    @classmethod
    def save_submission_review(cls, item_id, review_data):
        """Save submission item review."""
        submission_item = cls.get_item_by_id(item_id)
        if not submission_item:
            raise ValueError(f"Item with id {item_id} not found.")

        review = cls.get_item_review(item_id)
        if not review:
            review = SubmissionReview(item_id=item_id)

        review.form_answers.update(review_data)

        return review, submission_item

    @classmethod
    def save_submission_review_with_recommendation(cls, item_id, review_data):
        """Save submission item review."""
        review, submission_item = cls.save_submission_review(item_id, review_data)
        submission_item.status = review_data['status']

        return review, submission_item
