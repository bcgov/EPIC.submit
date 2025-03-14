"""Engagement model class.

Manages the engagement
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models import UserRole
from submit_api.models.user import UserType
from submit_api.schemas.account import AccountSchema
from submit_api.schemas.account_user import AccountUserSchema


# class AccountUserRoleSchema(Schema):
#     """Account User Role schema."""
#
#     class Meta:  # pylint: disable=too-few-public-methods
#         """Exclude unknown fields in the deserialized output."""
#
#         unknown = EXCLUDE
#
#     id = fields.Int(data_key="id")
#     account_user_id = fields.Int(data_key="account_user_id")
#     account_project_id = fields.Int(data_key="account_project_id")
#     package_ids = fields.List(fields.Int(), data_key="package_ids")
#     role_name = fields.Method("get_role_name")
#
#     @staticmethod
#     def get_role_name(obj: UserRole) -> str:
#         return obj.role.role_name
#
#
# class AccountUserSchema(Schema):
#     """User schema."""
#
#     class Meta:  # pylint: disable=too-few-public-methods
#         """Exclude unknown fields in the deserialized output."""
#
#         unknown = EXCLUDE
#
#     id = fields.Int(data_key="id")
#     first_name = fields.Str(data_key="first_name")
#     last_name = fields.Str(data_key="last_name")
#     work_email_address = fields.Str(data_key="email_address")
#     work_contact_number = fields.Str(data_key="contact_number")
#     account_id = fields.Int(data_key="account_id")
#     account = fields.Nested(AccountSchema, data_key="account", dump_only=True)
#     role = fields.Nested(AccountUserRoleSchema, data_key="role", dump_only=True)


class StaffUserSchema(Schema):
    """User schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE
    auth_guid = fields.Str(data_key="auth_guid")
    first_name = fields.Str(data_key="first_name")
    last_name = fields.Str(data_key="last_name")
    work_email_address = fields.Str(data_key="email_address")


class UserSchema(Schema):
    """User schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    auth_guid = fields.Str(data_key="auth_guid")
    type = fields.Enum(UserType, data_key="type")
    account_user = fields.Nested(AccountUserSchema, data_key="account_user", dump_only=True, required=False)
    staff_user = fields.Nested(StaffUserSchema, data_key="staff_user", dump_only=True, required=False)
