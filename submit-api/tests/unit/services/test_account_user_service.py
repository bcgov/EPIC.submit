"""Tests for AccountUserService.reactivate_deactivate_user."""
from unittest.mock import MagicMock, patch

import pytest

import submit_api.services.account_user_service as account_user_service_module


@pytest.fixture(autouse=True)
def mock_current_app():
    """Patch current_app to avoid application context errors."""
    mock_app = MagicMock()
    with patch.object(
        account_user_service_module, "current_app", mock_app
    ):
        yield mock_app


@pytest.fixture()
def mock_account_user():
    """Create a mock account user with roles."""
    account_user = MagicMock()
    role1 = MagicMock()
    role1.active = True
    role1.original_package_ids = [1, 2]
    role2 = MagicMock()
    role2.active = True
    role2.original_package_ids = [3]
    account_user.all_roles = [role1, role2]
    account_user.roles = [role1, role2]
    account_user.user_id = 1
    account_user.user = MagicMock()
    account_user.user.auth_guid = "auth-guid-123"
    account_user.to_dict.return_value = {
        "user_id": 1,
        "role": {"role_name": "PROJECT_ADMIN", "active": True, "original_package_ids": [1, 2]},
        "roles": [
            {"role_name": "PROJECT_ADMIN", "active": True, "original_package_ids": [1, 2]},
        ],
    }
    return account_user


@pytest.fixture()
def mock_validate_permission():
    """Patch _validate_user_permission to skip authorization checks."""
    with patch(
        "submit_api.services.account_user_service.AccountUserService._validate_user_permission"
    ) as mock_perm:
        yield mock_perm


@pytest.fixture()
def mock_db_session():
    """Patch db.session.commit."""
    with patch("submit_api.services.account_user_service.db.session") as mock_session:
        yield mock_session


@pytest.fixture()
def mock_user_model():
    """Patch UserModel.find_by_id to return a mock user."""
    with patch(
        "submit_api.services.account_user_service.UserModel"
    ) as mock_model:
        mock_user = MagicMock()
        mock_user.status_id = 1
        mock_model.find_by_id.return_value = mock_user
        yield mock_model, mock_user


@pytest.fixture()
def mock_account_user_model(mock_account_user):
    """Patch AccountUserModel to return mock account user."""
    with patch(
        "submit_api.services.account_user_service.AccountUserModel"
    ) as mock_model:
        mock_model.get_users_by_account_user_id.return_value = mock_account_user
        yield mock_model


@pytest.fixture()
def mock_fetch_status_revoked():
    """Patch _fetch_user_status_name to return ACCESS_REVOKED."""
    with patch(
        "submit_api.services.account_user_service.AccountUserService._fetch_user_status_name",
        return_value="ACCESS_REVOKED",
    ) as mock_status:
        yield mock_status


@pytest.fixture()
def mock_fetch_status_active():
    """Patch _fetch_user_status_name to return ACTIVE."""
    with patch(
        "submit_api.services.account_user_service.AccountUserService._fetch_user_status_name",
        return_value="ACTIVE",
    ) as mock_status:
        yield mock_status


@pytest.fixture()
def mock_fetch_packages():
    """Patch _fetch_package_names."""
    with patch(
        "submit_api.services.account_user_service.AccountUserService._fetch_package_names",
        return_value={1: "Package A", 2: "Package B"},
    ) as mock_pkg:
        yield mock_pkg


class TestReactivateDeactivateUserRevoke:
    """Tests for revoking (deactivating) a user."""

    def test_revoke_sets_roles_inactive(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_revoked,
        mock_fetch_packages,
    ):
        """Revoking a user should set all roles to inactive."""
        from submit_api.services.account_user_service import AccountUserService

        AccountUserService.reactivate_deactivate_user("user-guid", 99, active=False)

        for role in mock_account_user.all_roles:
            assert role.active is False

    def test_revoke_sets_access_end_timestamp(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_revoked,
        mock_fetch_packages,
    ):
        """Revoking a user should set access_end on all roles."""
        from submit_api.services.account_user_service import AccountUserService

        AccountUserService.reactivate_deactivate_user("user-guid", 99, active=False)

        for role in mock_account_user.all_roles:
            assert role.access_end is not None

    def test_revoke_sets_user_status_to_access_revoked(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_revoked,
        mock_fetch_packages,
    ):
        """Revoking a user should set User.status_id to ACCESS_REVOKED (3)."""
        from submit_api.services.account_user_service import AccountUserService

        _, mock_user = mock_user_model
        AccountUserService.reactivate_deactivate_user("user-guid", 99, active=False)

        assert mock_user.status_id == 3

    def test_revoke_does_not_touch_keycloak(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_revoked,
        mock_fetch_packages,
    ):
        """Revoking must not enable/disable the user in Keycloak.

        Access is enforced per-request against the DB status instead, so the
        module must no longer reference the auth service for this operation.
        """
        from submit_api.services.account_user_service import AccountUserService

        # The module should no longer import AuthService at all.
        assert not hasattr(account_user_service_module, "AuthService")

        # Sanity check the operation still completes without an auth-service call.
        AccountUserService.reactivate_deactivate_user("user-guid", 99, active=False)
        assert mock_user_model[1].status_id == 3


class TestReactivateDeactivateUserReactivate:
    """Tests for reactivating a user."""

    def test_reactivate_sets_roles_active(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_active,
        mock_fetch_packages,
    ):
        """Reactivating a user should set all roles to active."""
        # Set roles to inactive first
        for role in mock_account_user.all_roles:
            role.active = False

        from submit_api.services.account_user_service import AccountUserService

        AccountUserService.reactivate_deactivate_user("user-guid", 99, active=True)

        for role in mock_account_user.all_roles:
            assert role.active is True

    def test_reactivate_clears_access_end(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_active,
        mock_fetch_packages,
    ):
        """Reactivating a user should clear access_end on all roles."""
        from submit_api.services.account_user_service import AccountUserService

        AccountUserService.reactivate_deactivate_user("user-guid", 99, active=True)

        for role in mock_account_user.all_roles:
            assert role.access_end is None

    def test_reactivate_sets_user_status_to_active(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_active,
        mock_fetch_packages,
    ):
        """Reactivating a user should set User.status_id to ACTIVE (1)."""
        from submit_api.services.account_user_service import AccountUserService

        _, mock_user = mock_user_model
        AccountUserService.reactivate_deactivate_user("user-guid", 99, active=True)

        assert mock_user.status_id == 1


class TestReactivateDeactivateUserNonePackageIds:
    """Tests for handling None original_package_ids in roles."""

    def test_revoke_handles_none_original_package_ids(
        self,
        mock_account_user,
        mock_validate_permission,
        mock_db_session,
        mock_user_model,
        mock_account_user_model,
        mock_fetch_status_revoked,
        mock_fetch_packages,
    ):
        """Revoking should not crash when a role has None for original_package_ids."""
        from submit_api.services.account_user_service import AccountUserService

        # Override to_dict to return a role with None original_package_ids
        mock_account_user.to_dict.return_value = {
            "user_id": 1,
            "role": {"role_name": "PROJECT_ADMIN", "active": True, "original_package_ids": None},
            "roles": [
                {"role_name": "PROJECT_ADMIN", "active": True, "original_package_ids": None},
            ],
        }

        result = AccountUserService.reactivate_deactivate_user("user-guid", 99, active=False)

        assert result["roles"][0]["package_names"] == []
