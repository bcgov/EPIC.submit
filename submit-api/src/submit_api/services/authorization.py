"""
Authorization Service

Provides utility functions for checking user authorization in the system.
Handles validation of user roles and permissions.
"""
from http import HTTPStatus

from flask_restx import abort

from submit_api.enums.role import RoleEnum
from submit_api.models import User
from submit_api.models.user import UserType
from submit_api.utils.token_info import TokenInfo


# pylint: disable=unused-argument
def check_has_permission(required_permissions):
    """Check if user is authorized to perform action on the service."""
    user = User.get_by_guid(TokenInfo.get_id())
    if not user or not user.account_user or not user.account_user.role:
        abort(HTTPStatus.UNAUTHORIZED)

    user_permissions = set(user.account_user.role.permissions)
    has_valid_permissions = user_permissions & set(required_permissions)
    if not has_valid_permissions:
        abort(HTTPStatus.FORBIDDEN)

    return True


def check_assigned_on_package(package_id):
    """Check if user is assigned to the package."""
    if not package_id:
        abort(HTTPStatus.UNAUTHORIZED)

    user = User.get_by_guid(TokenInfo.get_id())
    if user.type == UserType.STAFF:
        return
    if not user or not user.account_user or not user.account_user.role:
        abort(HTTPStatus.UNAUTHORIZED)
    user_role = user.account_user.role

    sufficient_roles = {RoleEnum.PROJECT_ADMIN.value, RoleEnum.SUBMISSION_ADMIN.value}
    if user_role.role.role_name in sufficient_roles:
        return

    if user_role.role.role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value:
        if package_id in user_role.package_ids:
            return

    abort(HTTPStatus.UNAUTHORIZED)
