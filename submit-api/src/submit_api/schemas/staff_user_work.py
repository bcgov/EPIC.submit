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
    role = fields.Str(data_key="role")
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


class RemoveStaffUserWorkRequest(Schema):
    """Remove staff user work request schema."""

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
