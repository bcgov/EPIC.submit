"""AccountProjectWork schema.

This module defines the schema for the account_project_work entity.
"""
from marshmallow import EXCLUDE, Schema, fields

from submit_api.schemas.track_work import TrackWorkSchema


class AccountProjectWorkSchema(Schema):
    """Account project work schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    work_id = fields.Int(data_key="work_id")
    work = fields.Nested(TrackWorkSchema, data_key="work")
    work_role = fields.Str(attribute='current_user_work_role', data_key="work_role", allow_none=True)
