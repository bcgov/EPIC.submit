"""Item schema class.

Manages the item schema
"""

from marshmallow import EXCLUDE, Schema, fields


class StaffUserSchema(Schema):
    """item schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    first_name = fields.Str(data_key="first_name")
    last_name = fields.Str(data_key="last_name")
    full_name = fields.Str(data_key="full_name")
    work_email_address = fields.Str(data_key="work_email_address")
    user_id = fields.Int(data_key="user_id")
    work_assignments = fields.List(fields.Nested('StaffUserWorkSchema'), data_key="work_assignments")


class CreateStaffUserRequest(Schema):
    """Create staff user request schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    email = fields.Email(required=True, metadata={"description": "Email of the staff user"})
    group_name = fields.Str(required=True, metadata={"description": "Group to assign (Keycloak Group)"})
