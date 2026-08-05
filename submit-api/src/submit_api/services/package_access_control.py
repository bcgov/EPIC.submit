# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
Centralized Package Access Control Service

Provides operation-aware access control for packages based on package type
and user roles. Supports MP-type packages (Management Plan, IEM) and work packages.
"""
from http import HTTPStatus

from flask_restx import abort

from submit_api.auth import jwt
from submit_api.enums.package_operation import PackageOperation
from submit_api.enums.role import ProponentPermissionsEnum
from submit_api.models import Package as PackageModel
from submit_api.models import User as UserModel
from submit_api.models.user import UserType
from submit_api.utils.constants import MP_VIEW_PACKAGE_TYPES, MP_ROLE_OPERATIONS, W_ROLE_OPERATIONS
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.token_info import TokenInfo


class PackageAccessControl:
    """Centralized package access control service."""

    @staticmethod
    def check_package_access(
        package_id: int,
        operation: PackageOperation,
        abort_on_failure: bool = True
    ) -> bool:
        """
        Check if current user has permission for operation on package.

        Args:
            package_id: Package ID to check access for
            operation: Operation being performed (READ, EDIT, CREATE, APPROVE)
            abort_on_failure: If True, abort with 403; if False, return bool

        Returns:
            bool: True if access granted, False otherwise (when abort_on_failure=False)

        Raises:
            HTTPStatus.FORBIDDEN: If access denied and abort_on_failure=True
            HTTPStatus.NOT_FOUND: If package not found
            HTTPStatus.BAD_REQUEST: If package_id is invalid
        """
        package, user = PackageAccessControl._validate_package_and_user(package_id, abort_on_failure)
        if not package or not user:
            return False

        has_access = PackageAccessControl._evaluate_access(package, user, operation)

        if not has_access and abort_on_failure:
            abort(HTTPStatus.FORBIDDEN, f"Access denied for {operation.value} operation on this package")

        return has_access

    @staticmethod
    def _validate_package_and_user(package_id, abort_on_failure):
        """Validate and retrieve the package and user, aborting on failure if configured."""
        if not package_id:
            if abort_on_failure:
                abort(HTTPStatus.BAD_REQUEST, "Package ID is required")
            return None, None

        package = PackageModel.find_by_id(package_id)
        if not package:
            if abort_on_failure:
                abort(HTTPStatus.NOT_FOUND, "Package not found")
            return None, None

        user = UserModel.get_by_guid(TokenInfo.get_username())
        if not user:
            if abort_on_failure:
                abort(HTTPStatus.UNAUTHORIZED, "User not found")
            return None, None

        return package, user

    @staticmethod
    def _evaluate_access(package, user, operation):
        """Evaluate whether user has access for the given operation on package."""
        # FULL_ACCESS role bypasses all checks
        if user.type == UserType.STAFF and jwt.contains_role([EpicSubmitRole.FULL_ACCESS.value]):
            return True

        # Proponent CREATE is handled via project-level permissions
        if user.type == UserType.PROPONENT and operation == PackageOperation.CREATE:
            return PackageAccessControl._has_proponent_create_permission(package)

        # Determine package category and check access
        if package.account_project_work_id:
            return PackageAccessControl._has_work_package_permission(
                package.account_project_work_id, operation, user
            )
        if package.type.name in MP_VIEW_PACKAGE_TYPES:
            return PackageAccessControl._has_mp_package_permission(
                package.type.name, operation
            )
        return PackageAccessControl._has_eao_permission(operation)

    @staticmethod
    def check_package_type_access(
        package_type_name: str,
        operation: PackageOperation,
        account_project_work_id: int = None,
        abort_on_failure: bool = True
    ) -> bool:
        """Check if current user can perform operation on this package type.

        Used for CREATE operations before package exists.

        Args:
            package_type_name: Name of package type (e.g., 'Management Plan')
            operation: Operation being performed
            account_project_work_id: Work ID if work package, None otherwise
            abort_on_failure: If True, abort with 403; if False, return bool

        Returns:
            bool: True if access granted, False otherwise
        """
        user = UserModel.get_by_guid(TokenInfo.get_username())
        if not user:
            if abort_on_failure:
                abort(HTTPStatus.UNAUTHORIZED, "User not found")
            return False

        # Check FULL_ACCESS role
        if user.type == UserType.STAFF and jwt.contains_role([EpicSubmitRole.FULL_ACCESS.value]):
            return True

        # Determine package category
        if account_project_work_id:
            # Work package
            has_access = PackageAccessControl._has_work_package_permission(
                account_project_work_id, operation, user
            )
        elif package_type_name in MP_VIEW_PACKAGE_TYPES:
            # MP-type package
            has_access = PackageAccessControl._has_mp_package_permission(
                package_type_name, operation
            )
        else:
            # Other packages
            has_access = PackageAccessControl._has_eao_permission(operation)

        if not has_access and abort_on_failure:
            abort(
                HTTPStatus.FORBIDDEN,
                f"Access denied for {operation.value} operation on {package_type_name} packages"
            )

        return has_access

    @staticmethod
    def get_user_package_permissions(package_id: int) -> list:
        """Get list of operations current user can perform on package.

        Useful for UI to show/hide buttons.

        Args:
            package_id: Package ID to check

        Returns:
            list: List of PackageOperation enums user can perform
        """
        permissions = []
        for operation in PackageOperation:
            if PackageAccessControl.check_package_access(package_id, operation, abort_on_failure=False):
                permissions.append(operation)
        return permissions

    @staticmethod
    def _has_mp_package_permission(_package_type_name: str, operation: PackageOperation) -> bool:
        """
        Check if user has MP-type package permission for operation.

        Args:
            package_type_name: Package type name
            operation: Operation to check

        Returns:
            bool: True if user has permission
        """
        operation_value = operation.value

        # Check each MP role to see if it grants this operation
        for role_name, allowed_operations in MP_ROLE_OPERATIONS.items():
            if jwt.contains_role([role_name]) and operation_value in allowed_operations:
                return True

        return False

    @staticmethod
    def _has_work_package_permission(
        account_project_work_id: int,
        operation: PackageOperation,
        user: UserModel
    ) -> bool:
        """
        Check if user has work package permission for operation.

        Args:
            account_project_work_id: Work ID (can be AccountProjectWork ID)
            operation: Operation to check
            user: User model

        Returns:
            bool: True if user has permission
        """
        from submit_api.models import StaffUserWork, AccountProjectWork  # pylint: disable=import-outside-toplevel

        # Early exit for non-staff users or users without staff profile
        if user.type != UserType.STAFF or not user.staff_user:
            return False

        staff_user = user.staff_user

        # Get work_id from account_project_work_id
        account_project_work = AccountProjectWork.query.filter_by(id=account_project_work_id).first()
        if not account_project_work:
            return False

        work_id = account_project_work.work_id

        # Users with gis_extended_edit can bypass work assignment check
        if jwt.contains_role([EpicSubmitRole.GIS_EXTENDED_EDIT.value]):
            return True

        # Check if staff user has active assignment to this work
        staff_user_work = StaffUserWork.query.filter_by(
            staff_user_id=staff_user.id,
            work_id=work_id,
            is_active=True
        ).first()

        if not staff_user_work:
            return False

        # Check W_* role permissions
        operation_value = operation.value
        for role_name, allowed_operations in W_ROLE_OPERATIONS.items():
            if jwt.contains_role([role_name]) and operation_value in allowed_operations:
                return True

        return False

    @staticmethod
    def _has_eao_permission(operation: PackageOperation) -> bool:
        """
        Check if user has EAO permission for operation (backward compatibility).

        Args:
            operation: Operation to check

        Returns:
            bool: True if user has permission
        """
        if operation == PackageOperation.READ:
            return jwt.contains_role([EpicSubmitRole.EAO_VIEW.value])
        if operation == PackageOperation.EDIT:
            return jwt.contains_role([EpicSubmitRole.EAO_EDIT.value])
        if operation == PackageOperation.CREATE:
            return jwt.contains_role([EpicSubmitRole.EAO_CREATE.value])
        if operation == PackageOperation.APPROVE:
            # No EAO role for approve - would need specific implementation
            return False

        return False

    @staticmethod
    def _has_proponent_create_permission(package: PackageModel) -> bool:
        """Check if current proponent user has CREATE_PACKAGE permission on the package's project."""
        user = UserModel.get_by_guid(TokenInfo.get_username())
        if not user or not user.account_user or not user.account_user.roles:
            return False

        account_project_id = package.account_project_id
        user_roles = user.account_user.roles
        required_permission = ProponentPermissionsEnum.CREATE_PACKAGE.value

        # Find roles matching the package's project
        matched_roles = [
            role for role in user_roles
            if role.account_project_id == account_project_id
        ]

        if not matched_roles:
            return False

        # Check that at least one matched role has the required permission
        return any(
            required_permission in role.permissions
            for role in matched_roles
        )
