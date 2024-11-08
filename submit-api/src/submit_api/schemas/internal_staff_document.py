"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models.internal_staff_documents import InternalStaffDocumentType


class InternalStaffDocument(Schema):
    """internal staff document schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    url = fields.Str(data_key="url")
    type = fields.Enum(data_key="type", enum=InternalStaffDocumentType)
    submission_item_id = fields.Int(data_key="submission_item_id")
