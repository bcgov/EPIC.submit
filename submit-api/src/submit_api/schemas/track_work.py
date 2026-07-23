"""TrackWork schema.

This module defines the schema for the track_work entity.
"""
from marshmallow import EXCLUDE, Schema, fields

from submit_api.schemas.track_phase import TrackPhaseSchema


class TrackWorkSchema(Schema):
    """Track work schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    project_id = fields.Int(data_key="project_id")
    current_phase_id = fields.Int(data_key="current_phase_id", allow_none=True)
    work_state = fields.Str(data_key="work_state", allow_none=True)
    title = fields.Str(data_key="title", allow_none=True)
    contact_email = fields.Str(data_key="contact_email", allow_none=True)
    current_phase = fields.Nested(TrackPhaseSchema, data_key="current_phase", allow_none=True)
