from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import Item
from submit_api.models.internal_staff_document import InternalStaffDocument as InternalStaffDocumentModel


class InternalStaffDocumentService:
    """Item management service."""

    @classmethod
    def create_internal_staff_document(cls, submission_item_id, data):
        """Create internal staff document."""
        submission_item = Item.find_by_id(submission_item_id)
        if not submission_item:
            raise ResourceNotFoundError("Submission item not found")

        internal_staff_document = InternalStaffDocumentModel(
            name=data.get("name"),
            url=data.get("url"),
            type=data.get("type"),
            item_id=submission_item_id,
        )
        return internal_staff_document
