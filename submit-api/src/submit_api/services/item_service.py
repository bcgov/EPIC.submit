"""Service for item management."""
from flask import current_app

from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import Item as ItemModel
from submit_api.models.queries.package import PackageItemQueries
from submit_api.services import authorization


class ItemService:
    """Item management service."""

    @staticmethod
    def _apply_update_data(submission_item, update_data):
        """Apply update data to the submission item."""
        for key, value in update_data.items():
            setattr(submission_item, key, value)
        current_app.logger.debug(f"Updated submission item {submission_item.id} with data: {update_data}")

    @classmethod
    def get_item_by_id(cls, item_id) -> ItemModel:
        """Get item by id."""
        item = ItemModel.find_by_id(item_id)
        if not item:
            current_app.logger.warning(f"Item with id {item_id} not found.")
            raise ResourceNotFoundError(f"Item with id {item_id} not found.")
        authorization.has_access_to_package(item.package_id)
        return item

    @classmethod
    def update_submission_item_status(cls, item_id, status, session):
        """Update the status of the submission item."""
        submission_item = cls.get_item_by_id(item_id)
        existing_status = submission_item.status
        if existing_status != status:
            submission_item.status = status
            session.add(submission_item)
            session.flush()
            cls._update_package_status(submission_item.package_id, session)
            current_app.logger.info(f"Submission item {item_id} status updated to {status}.")

    @staticmethod
    def _update_package_status(package_id, session):
        """Update the status of the package based on the statuses of its items."""
        PackageItemQueries.update_package_status(package_id, session)
        current_app.logger.info(f"Package status updated for package ID: {package_id}")
