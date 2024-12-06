"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields, pre_dump


class SubmissionItemNote(Schema):
    """note schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    note = fields.Str(data_key="note")
    item_id = fields.Int(data_key="item_id")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get created_by."""
        obj.created_by = obj.created_by_user.account_user.full_name if obj.created_by_user else None
        return obj


class PostSubmissionItemNote(Schema):
    """Post note schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    note = fields.Str(data_key="note")
    submission_item_id = fields.Int(data_key="submission_item_id")
