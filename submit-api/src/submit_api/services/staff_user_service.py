"""Service for account management."""
from flask import current_app

from submit_api.exceptions import ResourceNotFoundError, BadRequestError
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
    def create_staff_user_if_missing(cls, data):
        """Create staff user."""
        user = UserModel.get_by_guid(data.get('auth_guid'))
        if not user:
            current_app.logger.error(f"User with guid {data.get('auth_guid')} not found.")
            raise ResourceNotFoundError("User not found.")

        staff_user = user.staff_user
        if staff_user:
            current_app.logger.info(f"Staff user already exists for user with guid {data.get('auth_guid')}")
            return staff_user

        staff_user_data = {
            "first_name": data.get('first_name'),
            "last_name": data.get('last_name'),
            "work_email_address": data.get('work_email_address'),
            "user_id": user.id
        }
        staff_user = StaffUser.create_staff_user(staff_user_data)
        current_app.logger.info(f"Staff user created for user with guid {data.get('auth_guid')}")
        return staff_user
