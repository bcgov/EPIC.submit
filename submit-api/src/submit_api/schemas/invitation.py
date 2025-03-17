"""Invitation schema class.

Manages the invitation.
"""

from submit_api.schemas.role import RoleSchema
from marshmallow import Schema, fields


class CreateInvitationSchema(Schema):
    """Schema for creating an invitation."""

    proponent_id = fields.Int(required=True, description="Proponent ID")
    account_id = fields.Int(required=False, description="Account ID")
    project_ids = fields.List(fields.Int(), required=True, description="List of Project IDs")
    role_name = fields.Str(required=True, description="Role Name")
    package_ids = fields.List(fields.Int(), required=False, allow_none=True)
    email = fields.Email(required=False, description="Optional email for client")


class InvitationSchema(Schema):
    """Schema for representing an invitation."""

    id = fields.Int()
    account_id = fields.Int()
    project_ids = fields.List(fields.Int())
    package_ids = fields.List(fields.Int(), allow_none=True)
    role_id = fields.Int()
    role_name = fields.Str()
    token = fields.Str()
    email = fields.Email(allow_none=True)
    status = fields.Str()
    expiry_date = fields.DateTime()
    created_date = fields.DateTime()
    role = fields.Nested(RoleSchema, data_key="role", dump_only=True)
    is_first_time = fields.Bool(default=False)
