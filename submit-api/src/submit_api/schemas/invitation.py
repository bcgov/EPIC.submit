"""Invitation schema class.

Manages the invitation
"""

from marshmallow import Schema, fields


class CreateInvitationSchema(Schema):
    """Schema for creating an invitation."""

    proponent_id = fields.Int(required=True, description="Proponent ID")
    account_id = fields.Int(required=True, description="Account ID")
    project_ids = fields.List(fields.Int(), required=True, description="List of Project IDs")
    role_id = fields.Int(required=True, description="Role ID")
    package_id = fields.Int(required=False, allow_none=True, description="Package ID (For submission-specific roles)")
    email = fields.Email(required=False, description="Optional email for client")


class InvitationSchema(Schema):
    """Schema for representing an invitation."""

    id = fields.Int()
    account_id = fields.Int()
    project_ids = fields.List(fields.Int())
    package_id = fields.Int(allow_none=True)
    role_id = fields.Int()
    token = fields.Str()
    email = fields.Email(allow_none=True)
    status = fields.Str()
    expiry_date = fields.DateTime()
    created_date = fields.DateTime()
