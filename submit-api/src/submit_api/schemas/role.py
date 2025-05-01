"""Role and UserRole Schema."""

from marshmallow import Schema, fields


class RoleSchema(Schema):
    """Schema for roles."""

    id = fields.Int()
    role_name = fields.Str()
    description = fields.Str()
    label = fields.Str()


class UserRoleSchema(Schema):
    """Schema for user roles."""

    role_id = fields.Int()
    account_user_id = fields.Int()
    account_project_id = fields.Int(allow_none=True)
    package_ids = fields.List(fields.Int(), allow_none=True)
    package_names = fields.List(fields.String(), allow_none=True)
    role_name = fields.Pluck(RoleSchema, "role_name", data_key="role_name", attribute="role")
    permissions = fields.List(fields.Str())
    active = fields.Bool(data_key="active")
