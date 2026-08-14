# NOTE: The `create_and_assign_group` and `get_or_create_staff_user_from_email` methods
# in this service are NOT used by any frontend UI component. The corresponding API endpoint
# (POST /staff-user) and frontend hook (useStaffAddUser) exist but are never called from
# any UI page. Consider removing this dead code path or wiring it up in the staff UI.
"""Service for account management."""
from flask import current_app

from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import StaffUser
from submit_api.models import User as UserModel
from submit_api.models.user import UserType
from submit_api.services.auth_service import AuthService


def _parse_group_path(group_path: str) -> tuple:
    """Parse a group path like 'SUBMIT/EAO_MANAGER' into (group_name, sub_group_name).

    Returns:
        tuple: (group_name, sub_group_name) where sub_group_name may be None.
    """
    segments = group_path.strip("/").split("/")
    if len(segments) == 1:
        return segments[0], None
    return segments[0], segments[1]


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
            current_app.logger.error(
                f"User with guid {data.get('auth_guid')} not found."
            )
            raise ResourceNotFoundError("User not found.")

        staff_user = user.staff_user
        if staff_user:
            current_app.logger.info(
                f"Staff user already exists for user with guid "
                f"{data.get('auth_guid')}"
            )
            return staff_user

        staff_user_data = {
            "first_name": data.get('first_name'),
            "last_name": data.get('last_name'),
            "work_email_address": data.get('work_email_address'),
            "user_id": user.id
        }
        staff_user = StaffUser.create_staff_user(staff_user_data)
        current_app.logger.info(
            f"Staff user created for user with guid {data.get('auth_guid')}"
        )
        return staff_user

    @classmethod
    def get_or_create_staff_user_from_email(cls, email: str) -> tuple:
        """Get or create staff user from epic.auth email lookup.

        Args:
            email: Email address of the staff user

        Returns:
            tuple: (StaffUser instance, username)

        Raises:
            ResourceNotFoundError: If user not found in epic.auth
            ValueError: If user doesn't have a valid username
        """
        # Check if staff user already exists with this email
        existing_staff_user = StaffUser.get_by_email(email)
        if existing_staff_user:
            username = existing_staff_user.user.auth_guid
            current_app.logger.info(
                f"Found existing StaffUser for email {email}"
            )
            return existing_staff_user, username

        auth_user = AuthService.get_user_by_email(email)
        username = auth_user.get("username")
        first_name = auth_user.get("first_name") or ""
        last_name = auth_user.get("last_name") or ""
        work_email = auth_user.get("email_address") or auth_user.get("email")

        if not username:
            raise ValueError(
                f"User with email '{email}' does not have a valid username."
            )

        user = UserModel.get_by_guid(username)
        if not user:
            user_data = {
                "auth_guid": username,
                "type": UserType.STAFF
            }
            user = UserModel.create_user(user_data)
            current_app.logger.info(f"Created User with username {username}")

        staff_user = user.staff_user
        if not staff_user:
            staff_user_data = {
                "first_name": first_name,
                "last_name": last_name,
                "work_email_address": work_email,
                "user_id": user.id
            }
            staff_user = StaffUser.create_staff_user(staff_user_data)
            current_app.logger.info(
                f"Created StaffUser for User with username {username}"
            )

        return staff_user, username

    @classmethod
    def create_and_assign_group(cls, email: str, group_name: str) -> StaffUser:
        """Create a user from epic.auth and assign them to a group."""
        staff_user, username = cls.get_or_create_staff_user_from_email(email)

        parent_group, sub_group = _parse_group_path(group_name)
        AuthService.update_user_group(username, parent_group, sub_group)

        return staff_user
