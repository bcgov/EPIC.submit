"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models.internal_staff_document import InternalStaffDocumentType


class InternalStaffDocumentSchema(Schema):
    """internal staff document schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    url = fields.Str(data_key="url")
    type = fields.Enum(data_key="type", enum=InternalStaffDocumentType)
    item_id = fields.Int(data_key="item_id")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")


class PostInternalStaffDocument(Schema):
    """Post internal staff document schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    name = fields.Str(data_key="name")
    url = fields.Str(data_key="url")
    type = fields.Enum(data_key="type", enum=InternalStaffDocumentType)
    submission_item_id = fields.Int(data_key="submission_item_id")
