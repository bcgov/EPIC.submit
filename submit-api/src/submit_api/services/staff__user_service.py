"""Service for account management."""
from submit_api.models import StaffUser
from submit_api.models import User as UserModel
from submit_api.models.user import UserType


class StaffService:
    """Staff management service."""

    @classmethod
    def get_staff_by_id(cls, _guid):
        """Get account by id."""
        db_account = StaffUser.get_by_guid(_guid)
        return db_account

    @classmethod
    def _create_staff_user(cls, data, account, session):
        """Create staff user."""
        user_data = {
            'auth_guid': data.get('auth_guid'),
            'type': UserType.STAFF.value
        }
        user = UserModel.create_user(user_data, session)
        staff_user_data = {
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "position": data.get("position"),
            "work_email_address": data.get("work_email_address"),
            "work_contact_number": data.get("work_contact_number"),
            "user_id": user.id
        }
        staff_user = StaffUser.create_staff_user(staff_user_data, session)
        return staff_user
