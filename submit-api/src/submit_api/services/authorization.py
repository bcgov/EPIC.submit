"""
Authorization Service

Provides utility functions for checking user authorization in the system.
Handles validation of user roles and permissions.
"""
from http import HTTPStatus

from flask_restx import abort

from submit_api.enums.role import RoleEnum
from submit_api.models import AccountUser as AccountUserModel
from submit_api.models import Package as PackageModel
from submit_api.models import User as UserModel
from submit_api.models import UserRole as UserRoleModel
from submit_api.models.user import UserType
from submit_api.utils.token_info import TokenInfo


def check_has_permissions_on_project(permissions=None, account_project_ids=None):
    """Check if user is assigned to all of the given projects."""
    user: UserModel = UserModel.get_by_guid(TokenInfo.get_username())
    if user.type == UserType.STAFF:
        return

    if not user or not user.account_user or not user.account_user.role or not account_project_ids:
        abort(HTTPStatus.UNAUTHORIZED)

    account_user: AccountUserModel = user.account_user
    user_roles: list[UserRoleModel] = account_user.roles

    # Collect roles that match any of the requested project IDs
    matched_roles = [role for role in user_roles if role.account_project_id in account_project_ids]
    matched_project_ids = {role.account_project_id for role in matched_roles}

    # Require access to ALL requested project IDs
    if not matched_project_ids.issuperset(set(account_project_ids)):
        abort(HTTPStatus.FORBIDDEN)

    if not permissions:
        # If no permissions are required, return success
        return

    # All matched roles must satisfy the required permissions
    required_permissions = set(permissions)
    for role in matched_roles:
        if not set(role.permissions) & required_permissions:
            abort(HTTPStatus.FORBIDDEN)

    return


def has_access_to_package(package_id):
    """Check if user is assigned to the package."""
    if not package_id:
        abort(HTTPStatus.BAD_REQUEST)

    package = PackageModel.find_by_id(package_id)
    if not package:
        abort(HTTPStatus.NOT_FOUND)

    user: UserModel = UserModel.get_by_guid(TokenInfo.get_username())
    if user.type == UserType.STAFF:
        return

    if not user or not user.account_user or not user.account_user.role:
        abort(HTTPStatus.UNAUTHORIZED)

    account_user: AccountUserModel = user.account_user
    user_roles: list[UserRoleModel] = account_user.roles

    sufficient_roles = {RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, RoleEnum.PROJECT_ADMIN.value, RoleEnum.SUBMISSION_ADMIN.value}

    for user_role in user_roles:
        if user_role.role.role_name in sufficient_roles:
            # check for specific access ...
            # check do they belong to the same project
            account_project_id_of_package = PackageModel.get_account_project_id_by_package_id(package_id)
            if account_project_id_of_package == user_role.account_project_id:
                return

        if user_role.role.role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value:
            if package.version.original_package_id in user_role.original_package_ids:
                return

    abort(HTTPStatus.FORBIDDEN)
