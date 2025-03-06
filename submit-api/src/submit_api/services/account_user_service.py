"""Service for account user management."""
from submit_api.models import AccountUser as AccountUserModel
from submit_api.models import Role as RoleModel
from submit_api.models import UserRole as UserRoleModel
from submit_api.models.role import RoleEnum


class AccountUserService:
    """Account User management service."""

    @classmethod
    def get_users_by_account(cls, account_id):
        """Get all users associated with an account."""
        return AccountUserModel.get_users_by_account_id(account_id)

    @classmethod
    def create_account_user(cls, data, session=None):
        """Create a new AccountUser."""
        return AccountUserModel.create_account_user(data, session)

    @classmethod
    def assign_role(cls, account_user_id, role_id, account_project_id=None, package_id=None, session=None):
        """Assign a role to the user."""
        role = RoleModel.find_by_id(role_id)
        if not role:
            raise ValueError(f"Invalid role ID: {role_id}")
        # dont need account project id for ACCOUNT_PRIMARY_ADMIN
        account_project_id = None if role.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value else account_project_id
        # only for SPECIFIC_SUBMISSION_CONTRIBUTOR , save package id
        package_id = package_id if role.role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value else None
        role_data = {
            "account_user_id": account_user_id,
            "role_id": role_id,
            "account_project_id": account_project_id,
            "package_id": package_id
        }

        UserRoleModel.create_user_role(role_data, session)
        return {
            "role_id": role.id,
            "role_name": role.role_name,
            "account_project_id": role_data["account_project_id"],
            "package_id": role_data["package_id"]
        }
