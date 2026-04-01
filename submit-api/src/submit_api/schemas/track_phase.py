"""TrackPhase schema.

This module defines the schema for the track_phase entity.
"""
from marshmallow import EXCLUDE, Schema, fields


class TrackPhaseSchema(Schema):
    """Track phase schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    ea_act_id = fields.Int(data_key="ea_act_id", allow_none=True)
    work_type_id = fields.Int(data_key="work_type_id")
    work_type_name = fields.Str(data_key="work_type_name", allow_none=True)
    sort_order = fields.Int(data_key="sort_order", allow_none=True)
    number_of_days = fields.Int(data_key="number_of_days", allow_none=True)
    legislated = fields.Boolean(data_key="legislated")
