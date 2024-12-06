"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields, post_dump
from submit_api.models.user import User
from submit_api.models.db import db


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

    @post_dump
    def transform_created_by(self, data, **kwargs):
        """Temporarily transform created_by to display the user's full name."""
        user_id = data.get("created_by")
        if user_id:
            user = db.session.query(User).filter(User.auth_guid == user_id).first()
            if user and user.account_user:
                # Temporarily modify the output for serialization
                data["created_by"] = user.account_user.full_name
        return data


class PostSubmissionItemNote(Schema):
    """Post note schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    note = fields.Str(data_key="note")
    submission_item_id = fields.Int(data_key="submission_item_id")
