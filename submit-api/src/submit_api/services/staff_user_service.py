"""Service for account management."""
from submit_api.models import StaffUser
from submit_api.models import User as UserModel
from submit_api.models.user import UserType


class StaffUserService:
    """Staff management service."""

    @classmethod
    def get_staff_by_id(cls, _guid):
        """Get account by id."""
        db_account = StaffUser.get_by_guid(_guid)
        return db_account

    @classmethod
    def create_staff_user(cls, data):
        """Create staff user."""
        user = UserModel.get_by_guid(data.get('auth_guid'))
        if not user:
            # Create the user if it does not exist
            user_data = {
                'auth_guid': data.get('auth_guid'),
                'type': UserType.STAFF.value
            }
            user = UserModel.create_user(user_data)
        staff_user_data = {
            "first_name": data.get('first_name'),
            "last_name": data.get('last_name'),
            "work_email_address": data.get('work_email_address'),
            "user_id": user.id
        }
        staff_user = StaffUser.create_staff_user(staff_user_data)
        return staff_user
