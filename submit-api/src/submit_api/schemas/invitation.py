"""Invitation schema class.

Manages the invitation.
"""

from submit_api.schemas.role import RoleSchema
from marshmallow import Schema, fields


class CreateNewAccountInvitationSchema(Schema):
    """Schema for creating a new account invitation."""

    proponent_id = fields.Int(required=True, description="Proponent ID")
    role_name = fields.Str(required=True, description="Role Name")
    project_ids = fields.List(fields.Int(), required=False, description="List of Project IDs")


class CreateInvitationToExistingAccountProjectSchema(Schema):
    """Schema for creating an invitation."""

    proponent_id = fields.Int(required=True, description="Proponent ID")
    account_id = fields.Int(required=False, description="Account ID")
    account_project_ids = fields.List(fields.Int(), required=False, description="List of Account Project IDs")
    role_name = fields.Str(required=True, description="Role Name")
    original_package_ids = fields.List(fields.Int(),
                                       required=False, allow_none=True, description="Original Package IDs")
    email = fields.Email(required=False, description="Optional email for client")


class InvitationSchema(Schema):
    """Schema for representing an invitation."""

    id = fields.Int()
    account_id = fields.Int()
    project_ids = fields.List(fields.Int())
    package_ids = fields.List(fields.Int(), allow_none=True)
    original_package_ids = fields.List(fields.Int(), allow_none=True)
    role_id = fields.Int()
    role_name = fields.Str()
    token = fields.Str()
    email = fields.Email(allow_none=True)
    status = fields.Str()
    expiry_date = fields.DateTime()
    created_date = fields.DateTime()
    role = fields.Nested(RoleSchema, data_key="role", dump_only=True)
    is_first_time = fields.Bool(default=False)
    proponent_id = fields.Method("get_proponent_id")

    def get_proponent_id(self, obj):
        """Get proponent_id from the related account."""
        return obj.account.proponent_id if obj.account else None
