"""Service for account management."""
from flask import current_app
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import User
from submit_api.models.user import UserType
from submit_api.models.staff_user import StaffUser
from submit_api.utils.roles import EpicSubmitRole


class UserService:
    """Account management service."""

    @classmethod
    def get_by_auth_guid(cls, _guid):
        """Get account by auth guid."""
        user = User.get_by_guid(_guid)
        if not user:
            raise ResourceNotFoundError(f"User with auth guid {_guid} not found")
        return user

    @classmethod
    def get_or_provision_by_auth_guid(cls, _guid, token_info=None):
        """Get user by auth guid, or auto-provision staff user if they have valid roles."""
        user = User.get_by_guid(_guid)

        if not user and token_info:
            # Check if user has staff roles in their token
            if cls._has_staff_roles(token_info):
                user = cls._auto_provision_staff_user(_guid, token_info)

        if not user:
            raise ResourceNotFoundError(f"User with auth guid {_guid} not found")

        return user

    @classmethod
    def _has_staff_roles(cls, token_info):
        """Check if token contains any EPIC Submit staff roles."""
        app_name = current_app.config.get('JWT_OIDC_AUDIENCE')
        roles = token_info.get('resource_access', {}).get(app_name, {}).get('roles', [])

        # Get all valid staff role values
        staff_roles = [role.value for role in EpicSubmitRole]

        return any(role in staff_roles for role in roles)

    @classmethod
    def _auto_provision_staff_user(cls, _guid, token_info):
        """Auto-provision a staff user from token info."""
        email = token_info.get('email')
        given_name = token_info.get('given_name')
        family_name = token_info.get('family_name')

        # Create user record
        user_data = {
            'auth_guid': _guid,
            'type': UserType.STAFF
        }
        user = cls.create_user(user_data)

        # Create staff_user record
        staff_user_data = {
            'first_name': given_name,
            'last_name': family_name,
            'work_email_address': email,
            'user_id': user.id
        }
        StaffUser.create_staff_user(staff_user_data)

        current_app.logger.info(f"Auto-provisioned staff user: {email} (guid: {_guid})")

        return user

    @classmethod
    def create_user(cls, data, session=None):
        """Create a new user."""
        return User.create_user(data, session)
