"""Unit tests for PackageAccessControl proponent CREATE permission."""
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.package_operation import PackageOperation
from submit_api.models.user import UserType
from submit_api.services.package_access_control import PackageAccessControl


MODULE_PATH = "submit_api.services.package_access_control"


@pytest.fixture()
def mock_package():
    """Create a mock package with account_project_id."""
    package = Mock()
    package.id = 1
    package.account_project_id = 42
    package.account_project_work_id = None
    package.type = Mock()
    package.type.name = "Management Plan"
    return package


@pytest.fixture()
def mock_proponent_user():
    """Create a mock proponent user."""
    user = Mock()
    user.type = UserType.PROPONENT
    user.staff_user = None
    return user


@pytest.fixture()
def mock_staff_user():
    """Create a mock staff user."""
    user = Mock()
    user.type = UserType.STAFF
    user.staff_user = Mock()
    return user


class TestProponentCreatePermission:
    """Tests for proponent CREATE_PACKAGE permission in PackageAccessControl."""

    @patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="proponent-guid")
    def test_proponent_with_create_permission_is_granted_access(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_proponent_user
    ):
        """Proponent with CREATE_PACKAGE permission is granted access for CREATE operation."""
        mock_find_pkg.return_value = mock_package
        # Set up user with CREATE_PACKAGE permission on the package's project
        mock_role = Mock()
        mock_role.account_project_id = mock_package.account_project_id
        mock_role.permissions = ["CREATE_PACKAGE"]
        mock_proponent_user.account_user = Mock()
        mock_proponent_user.account_user.role = Mock()
        mock_proponent_user.account_user.roles = [mock_role]
        mock_get_user.return_value = mock_proponent_user

        result = PackageAccessControl.check_package_access(
            package_id=1,
            operation=PackageOperation.CREATE,
            abort_on_failure=False
        )

        assert result is True

    @patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="proponent-guid")
    def test_proponent_without_create_permission_is_denied(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_proponent_user
    ):
        """Proponent without CREATE_PACKAGE permission is denied with False."""
        mock_find_pkg.return_value = mock_package
        # Set up user with a role that does NOT have CREATE_PACKAGE permission
        mock_role = Mock()
        mock_role.account_project_id = mock_package.account_project_id
        mock_role.permissions = ["SUBMIT_PACKAGE"]
        mock_proponent_user.account_user = Mock()
        mock_proponent_user.account_user.role = Mock()
        mock_proponent_user.account_user.roles = [mock_role]
        mock_get_user.return_value = mock_proponent_user

        result = PackageAccessControl.check_package_access(
            package_id=1,
            operation=PackageOperation.CREATE,
            abort_on_failure=False
        )

        assert result is False

    @patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="proponent-guid")
    def test_proponent_without_permission_aborts_with_403(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_proponent_user
    ):
        """Proponent without CREATE_PACKAGE permission triggers 403 abort."""
        mock_find_pkg.return_value = mock_package
        # Set up user with no matching project role
        mock_role = Mock()
        mock_role.account_project_id = 999  # Different project
        mock_role.permissions = ["CREATE_PACKAGE"]
        mock_proponent_user.account_user = Mock()
        mock_proponent_user.account_user.role = Mock()
        mock_proponent_user.account_user.roles = [mock_role]
        mock_get_user.return_value = mock_proponent_user

        with patch(f"{MODULE_PATH}.abort") as mock_abort:
            mock_abort.side_effect = SystemExit(403)
            with pytest.raises(SystemExit):
                PackageAccessControl.check_package_access(
                    package_id=1,
                    operation=PackageOperation.CREATE,
                    abort_on_failure=True
                )
            mock_abort.assert_called_once_with(
                403, "Access denied for create operation on this package"
            )

    @patch(f"{MODULE_PATH}.jwt.contains_role", return_value=True)
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="staff-guid")
    def test_staff_with_full_access_bypasses_all_checks(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_staff_user
    ):
        """Staff user with FULL_ACCESS role bypasses all checks including proponent path."""
        mock_find_pkg.return_value = mock_package
        mock_get_user.return_value = mock_staff_user

        result = PackageAccessControl.check_package_access(
            package_id=1,
            operation=PackageOperation.CREATE,
            abort_on_failure=False
        )

        assert result is True

    @patch(f"{MODULE_PATH}.jwt.contains_role")
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="staff-guid")
    def test_staff_without_full_access_uses_role_based_checks(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_staff_user
    ):
        """Staff user without FULL_ACCESS uses existing MP role-based checks."""
        mock_find_pkg.return_value = mock_package
        mock_get_user.return_value = mock_staff_user
        # First call: FULL_ACCESS check returns False
        # Subsequent calls: mp_create role check returns True
        mock_contains_role.side_effect = lambda roles: "mp_create" in roles

        result = PackageAccessControl.check_package_access(
            package_id=1,
            operation=PackageOperation.CREATE,
            abort_on_failure=False
        )

        assert result is True


class TestProponentPermissionOnlyForCreate:
    """Tests that proponent permission check is only applied for CREATE operation."""

    @patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="proponent-guid")
    def test_proponent_read_does_not_use_create_permission_check(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_proponent_user
    ):
        """Proponent READ operation does not trigger _has_proponent_create_permission."""
        mock_find_pkg.return_value = mock_package
        mock_proponent_user.account_user = Mock()
        mock_proponent_user.account_user.role = Mock()
        mock_proponent_user.account_user.roles = []
        mock_get_user.return_value = mock_proponent_user

        result = PackageAccessControl.check_package_access(
            package_id=1,
            operation=PackageOperation.READ,
            abort_on_failure=False
        )

        # For READ, proponent create permission check is not used
        # Result depends on MP role checks which return False with mocked jwt
        assert result is False

    @patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="proponent-guid")
    def test_proponent_edit_does_not_use_create_permission_check(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_proponent_user
    ):
        """Proponent EDIT operation does not trigger _has_proponent_create_permission."""
        mock_find_pkg.return_value = mock_package
        mock_proponent_user.account_user = Mock()
        mock_proponent_user.account_user.role = Mock()
        mock_proponent_user.account_user.roles = []
        mock_get_user.return_value = mock_proponent_user

        result = PackageAccessControl.check_package_access(
            package_id=1,
            operation=PackageOperation.EDIT,
            abort_on_failure=False
        )

        assert result is False

    @patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
    @patch(f"{MODULE_PATH}.UserModel.get_by_guid")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="proponent-guid")
    def test_proponent_approve_does_not_use_create_permission_check(
        self, mock_username, mock_find_pkg, mock_get_user,
        mock_contains_role,
        mock_package, mock_proponent_user
    ):
        """Proponent APPROVE operation does not trigger _has_proponent_create_permission."""
        mock_find_pkg.return_value = mock_package
        mock_proponent_user.account_user = Mock()
        mock_proponent_user.account_user.role = Mock()
        mock_proponent_user.account_user.roles = []
        mock_get_user.return_value = mock_proponent_user

        result = PackageAccessControl.check_package_access(
            package_id=1,
            operation=PackageOperation.APPROVE,
            abort_on_failure=False
        )

        assert result is False
