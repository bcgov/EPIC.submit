"""AccountUserSchema class.

Manages the AccountUserSchema
"""

from marshmallow import Schema, fields

from submit_api.schemas.account import AccountSchema
from submit_api.schemas.role import UserRoleSchema


class AccountUserSchema(Schema):
    """Schema for representing an account user with roles."""

    id = fields.Int()
    invitation_id = fields.Int()
    account_id = fields.Int()
    first_name = fields.Str()
    last_name = fields.Str()
    full_name = fields.Str()
    position = fields.Str()
    work_email_address = fields.Email()
    work_contact_number = fields.Str()
    user_id = fields.Int()
    role = fields.Nested(UserRoleSchema)
    status = fields.Str(required=False)
    account = fields.Nested(AccountSchema, data_key="account", dump_only=True)
    agreed_terms_of_service_id = fields.Int(data_key="agreed_terms_of_service_id")
    agreed_terms = fields.Bool(data_key="agreed_terms")


class EditRoleSchema(Schema):
    """Schema for editing a users role."""

    role_name = fields.Str()
    package_ids = fields.List(fields.Int(), allow_none=True)


class EditTermsOfServiceSchema(Schema):
    """Update user terms of service schema."""

    agreed_terms_of_service_id = fields.Int(data_key="agreed_terms_of_service_id")
    agreed_terms = fields.Bool(data_key="agreed_terms")
