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


def check_has_permissions_on_project(permissions=None, account_project_id=None):
    """Check if user is assigned to the project."""
    user: UserModel = UserModel.get_by_guid(TokenInfo.get_id())
    if user.type == UserType.STAFF:
        return

    if not user or not user.account_user or not user.account_user.role or not account_project_id:
        abort(HTTPStatus.UNAUTHORIZED)

    account_user: AccountUserModel = user.account_user
    user_role: UserRoleModel = account_user.role

    if user_role.account_project_id != account_project_id:
        abort(HTTPStatus.FORBIDDEN)

    if not permissions:
        # If no permissions are required, return success
        return

    user_permissions = set(user_role.permissions)
    has_valid_permissions = user_permissions & set(permissions)
    if not has_valid_permissions:
        abort(HTTPStatus.FORBIDDEN)

    return


def check_assigned_on_package(package_id):
    """Check if user is assigned to the package."""
    if not package_id:
        abort(HTTPStatus.BAD_REQUEST)

    package = PackageModel.find_by_id(package_id)
    if not package:
        abort(HTTPStatus.NOT_FOUND)

    user: UserModel = UserModel.get_by_guid(TokenInfo.get_id())
    if user.type == UserType.STAFF:
        return

    if not user or not user.account_user or not user.account_user.role:
        abort(HTTPStatus.UNAUTHORIZED)

    account_user: AccountUserModel = user.account_user
    user_role: UserRoleModel = account_user.role

    sufficient_roles = {RoleEnum.PROJECT_ADMIN.value, RoleEnum.SUBMISSION_ADMIN.value}
    if user_role.role.role_name in sufficient_roles:
        # check for specific access ...
        # check do they belong to the same project
        account_project_id_of_package = PackageModel.get_account_project_id_by_package_id(package_id)
        if account_project_id_of_package != user_role.account_project_id:
            abort(HTTPStatus.FORBIDDEN)

        return

    if user_role.role.role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value:
        if package.version.original_package_id in user_role.original_package_ids:
            return

    abort(HTTPStatus.FORBIDDEN)
