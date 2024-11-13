"""Service for item management."""
from submit_api.models import Item as ItemModel
from submit_api.models.db import session_scope
from submit_api.models.queries.package import PackageQueries


class ItemService:
    """Item management service."""

    @classmethod
    def get_item_by_id(cls, item_id) -> ItemModel:
        """Get item by id."""
        return ItemModel.find_by_id(item_id)

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

            status_key_name = 'status'
            if 'status' in update_data and existing_status != update_data[status_key_name]:
                cls._update_package_status(submission_item.package_id, session)

            session.commit()

        return submission_item
