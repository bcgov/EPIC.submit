"""AccountUserSchema class.

Manages the AccountUserSchema
"""

from marshmallow import Schema, fields


class RoleSchema(Schema):
    """Schema for user roles."""

    role_id = fields.Int()
    role_name = fields.Str()
    account_project_id = fields.Int(allow_none=True)
    package_ids = fields.List(fields.Int(), allow_none=True)


class AccountUserSchema(Schema):
    """Schema for representing an account user with roles."""

    id = fields.Int()
    account_id = fields.Int()
    first_name = fields.Str()
    last_name = fields.Str()
    full_name = fields.Str()
    position = fields.Str()
    work_email_address = fields.Email()
    work_contact_number = fields.Str()
    user_id = fields.Int()
    roles = fields.List(fields.Nested(RoleSchema))
