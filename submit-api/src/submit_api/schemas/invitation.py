"""Invitation schema class.

Manages the invitation
"""
from marshmallow import Schema, fields


class CreateInvitationSchema(Schema):
    """Invitation creating schema."""

    proponent_id = fields.Int(required=True, description="Proponent ID")
    project_ids = fields.List(fields.Int(), required=True, description="List of Project IDs")
    email = fields.Email(required=False, description="Optional email for client")


class InvitationSchema(Schema):
    """Invite schema."""

    id = fields.Int()
    account_id = fields.Int()
    project_ids = fields.Str()
    token = fields.Str()
    email = fields.Email()
    status = fields.Str()
    expiry_date = fields.DateTime()
    created_date = fields.DateTime()
