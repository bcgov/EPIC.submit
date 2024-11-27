"""Item schema class.

Manages the item schema
"""

from marshmallow import EXCLUDE, Schema, fields, pre_dump

from submit_api.enums.item_status import ItemStatus
from submit_api.models.submission import SubmissionTypeStatus
from submit_api.schemas.internal_staff_document import InternalStaffDocument
from submit_api.schemas.item_type import ItemTypeSchema
from submit_api.schemas.submission import SubmittedDocumentSchema, SubmittedFormSchema
from submit_api.schemas.submission_review import SubmissionReviewSchema


class ItemSubmissionSchema(Schema):
    """submission schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    item_id = fields.Int(data_key="item_id")
    type = fields.Enum(data_key="type", enum=SubmissionTypeStatus)
    submitted_document_id = fields.Int(data_key="submitted_document_id")
    submitted_form_id = fields.Int(data_key="submitted_form_id")
    submitted_form = fields.Nested(SubmittedFormSchema, data_key="submitted_form")
    submitted_document = fields.Nested(SubmittedDocumentSchema, data_key="submitted_document")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")
    submitted_by = fields.Str(data_key="submitted_by")
    version = fields.Int(data_key="version")

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = obj.submitted_by_user.account_user.full_name if obj.submitted_by_user else None
        return obj


class ItemSchema(Schema):
    """item schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    package_id = fields.Int(data_key="package_id")
    type_id = fields.Int(data_key="type_id")
    type = fields.Nested(ItemTypeSchema, data_key="type")
    status = fields.Enum(data_key="status", enum=ItemStatus)
    version = fields.Int(data_key="version")
    submitted_on = fields.DateTime(data_key="submitted_on")
    submitted_by = fields.Str(data_key="submitted_by")
    submissions = fields.Nested(ItemSubmissionSchema, data_key="submissions", many=True)
    sort_order = fields.Int(data_key="sort_order")


class StaffItemSchema(ItemSchema):
    """item schema for staff."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    internal_staff_documents = fields.Nested(InternalStaffDocument, data_key="internal_staff_documents", many=True)
    review = fields.Nested(SubmissionReviewSchema, data_key="review")
