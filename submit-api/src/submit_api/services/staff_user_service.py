"""Service for account management."""
from flask import current_app

from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import StaffUser
from submit_api.models import User as UserModel
from submit_api.models.user import UserType
from submit_api.services.keycloak import KeycloakService


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

    @classmethod
    def create_and_assign_group(cls, email: str, group_name: str) -> StaffUser:
        """Create a user from Keycloak and assign them to a Keycloak group."""
        # 1. Fetch user from Keycloak
        keycloak_user = KeycloakService.get_user_by_email(email)
        auth_guid = keycloak_user.get("id")
        first_name = keycloak_user.get("firstName") or ""
        last_name = keycloak_user.get("lastName") or ""
        work_email = keycloak_user.get("email")
        username = keycloak_user.get("username")

        if not auth_guid:
            raise ValueError(f"Keycloak user with email '{email}' does not have a valid ID.")

        # 2. Create or fetch local User
        user = UserModel.get_by_guid(auth_guid)
        if not user:
            user_data = {
                "auth_guid": auth_guid,
                "type": UserType.STAFF
            }
            user = UserModel.create_user(user_data)
            current_app.logger.info(f"Created User with GUID {auth_guid}")

        # 3. Create or fetch local StaffUser
        staff_user = user.staff_user
        if not staff_user:
            staff_user_data = {
                "first_name": first_name,
                "last_name": last_name,
                "work_email_address": work_email,
                "user_id": user.id
            }
            staff_user = StaffUser.create_staff_user(staff_user_data)
            current_app.logger.info(f"Created StaffUser for User with GUID {auth_guid}")

        # 4. Assign to Keycloak group
        group_id = KeycloakService.get_group_id_by_path(group_name)
        KeycloakService.update_user_group(user_id=username, group_id=group_id)

        return staff_user
