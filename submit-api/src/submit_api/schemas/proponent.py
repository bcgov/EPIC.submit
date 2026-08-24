"""Proponent schema.

This module defines the schema for the proponent entity.
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.enums.proponent_status import ProponentStatus


class ProponentSchema(Schema):
    """Proponent schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name", allow_none=False)
    status = fields.Enum(enum=ProponentStatus,
                         data_key="status", allow_none=True, required=False)
    is_deleted = fields.Bool(data_key="is_deleted", allow_none=False)
    invitations = fields.List(
        fields.Int(), data_key="invitations", required=False, dump_default=[])
    projects = fields.List(fields.Int(), data_key="projects",
                           required=False, dump_default=[])


class EnableProponentProjectsSchema(Schema):
    """Schema for adding account_projects to proponent."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    projects = fields.List(fields.Int(), data_key="projects", required=False)
    eligibility_entry_ids = fields.List(
        fields.Str(), data_key="eligibility_entry_ids", required=False)
