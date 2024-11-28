"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models.internal_staff_document import InternalStaffDocumentType


class Note(Schema):
    """note schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    note = fields.Str(data_key="note")
    item_id = fields.Int(data_key="item_id")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")


class PostNote(Schema):
    """Post note schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    note = fields.Str(data_key="note")
    submission_item_id = fields.Int(data_key="submission_item_id")
