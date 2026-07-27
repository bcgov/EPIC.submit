"""Staff User Work schema class.

Manages the staff user work schemas
"""

from marshmallow import EXCLUDE, Schema, fields, validate


class StaffUserWorkSchema(Schema):
    """Staff user work assignment schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    staff_user_id = fields.Int(data_key="staff_user_id")
    work_id = fields.Int(data_key="work_id")
    is_active = fields.Bool(data_key="is_active")
    work = fields.Nested('TrackWorkSchema', data_key="work")


class CreateStaffUserWorkRequest(Schema):
    """Create/update staff user work request schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    email = fields.Email(
        required=True,
        metadata={"description": "Email of the staff user"}
    )
    work_id = fields.Int(
        required=True,
        metadata={"description": "Work ID from EPIC.track"}
    )
    role = fields.Str(
        required=True,
        validate=validate.OneOf(['TEAM_LEAD', 'TEAM_MEMBER']),
        metadata={"description": "Work role: TEAM_LEAD or TEAM_MEMBER"}
    )


class StaffWorkRoleResponseSchema(Schema):
    """Response schema for staff work role with email and basic details."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    work_id = fields.Int(data_key="work_id")
    email = fields.Method('get_email', data_key="email")
    first_name = fields.Method('get_first_name', data_key="first_name")
    last_name = fields.Method('get_last_name', data_key="last_name")
    full_name = fields.Method('get_full_name', data_key="full_name")
    staff_user_id = fields.Int(data_key="staff_user_id")
    is_active = fields.Bool(data_key="is_active")

    @staticmethod
    def get_email(obj):
        """Get staff user email."""
        return obj.staff_user.work_email_address if obj.staff_user else None

    @staticmethod
    def get_first_name(obj):
        """Get staff user first name."""
        return obj.staff_user.first_name if obj.staff_user else None

    @staticmethod
    def get_last_name(obj):
        """Get staff user last name."""
        return obj.staff_user.last_name if obj.staff_user else None

    @staticmethod
    def get_full_name(obj):
        """Get staff user full name."""
        return obj.staff_user.full_name if obj.staff_user else None
