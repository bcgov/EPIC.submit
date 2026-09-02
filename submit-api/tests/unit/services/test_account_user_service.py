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


class TestGetUsersByAccountProjectsScoping:
    """Tests that a proponent only sees users/invitations for projects they can access."""

    @staticmethod
    def _make_account_user_with_projects(project_ids, role_name="PROJECT_ADMIN"):
        """Build a mock account user whose roles map to the given account_project_ids."""
        account_user = MagicMock()
        roles = []
        for pid in project_ids:
            role = MagicMock()
            role.account_project_id = pid
            role.role.role_name = role_name
            roles.append(role)
        account_user.roles = roles
        return account_user

    def test_returns_empty_when_user_has_no_project_roles(self):
        """A proponent with no project roles must see no users or invitations."""
        from submit_api.services.account_user_service import AccountUserService

        account_user = self._make_account_user_with_projects([])

        with patch(
            "submit_api.services.account_user_service.AccountUserModel"
        ) as mock_model, patch(
            "submit_api.services.account_user_service.TokenInfo"
        ) as mock_token, patch.object(
            AccountUserService, "get_users_by_account"
        ) as mock_get:
            mock_token.get_username.return_value = "guid-1"
            mock_model.get_by_guid.return_value = account_user

            result = AccountUserService.get_users_by_account_projects(
                account_id=1, include_roles=True, include_invitees=True
            )

        assert result == []
        mock_get.assert_not_called()

    def test_scopes_to_only_the_users_project_ids(self):
        """The user's own account_project_ids are passed to the scoped fetch."""
        from submit_api.services.account_user_service import AccountUserService

        # User only has access to account_project 10 (project 1).
        account_user = self._make_account_user_with_projects([10])

        with patch(
            "submit_api.services.account_user_service.AccountUserModel"
        ) as mock_model, patch(
            "submit_api.services.account_user_service.TokenInfo"
        ) as mock_token, patch.object(
            AccountUserService, "get_users_by_account", return_value=[]
        ) as mock_get:
            mock_token.get_username.return_value = "guid-1"
            mock_model.get_by_guid.return_value = account_user

            AccountUserService.get_users_by_account_projects(
                account_id=1, include_roles=True, include_invitees=True
            )

        mock_get.assert_called_once_with(
            1,
            include_roles=True,
            include_invitees=True,
            account_project_ids=[10],
            exclude_account_admins=True,
        )

    def test_entity_admin_sees_all_users_unscoped(self):
        """An account primary admin fetches all account users without project scoping."""
        from submit_api.services.account_user_service import AccountUserService

        # Admin holds an account-wide role (account_project_id is None).
        account_user = self._make_account_user_with_projects(
            [None], role_name="ACCOUNT_PRIMARY_ADMIN"
        )

        with patch(
            "submit_api.services.account_user_service.AccountUserModel"
        ) as mock_model, patch(
            "submit_api.services.account_user_service.TokenInfo"
        ) as mock_token, patch.object(
            AccountUserService, "get_users_by_account", return_value=[]
        ) as mock_get:
            mock_token.get_username.return_value = "admin-guid"
            mock_model.get_by_guid.return_value = account_user

            AccountUserService.get_users_by_account_projects(
                account_id=1, include_roles=True, include_invitees=True
            )

        # No account_project_ids passed => unscoped (all users/invitations).
        mock_get.assert_called_once_with(
            1,
            include_roles=True,
            include_invitees=True,
        )

    def test_entity_admin_with_project_role_still_unscoped(self):
        """An admin that also holds a project role still sees everything."""
        from submit_api.services.account_user_service import AccountUserService

        account_user = self._make_account_user_with_projects(
            [10], role_name="ACCOUNT_PRIMARY_ADMIN"
        )

        with patch(
            "submit_api.services.account_user_service.AccountUserModel"
        ) as mock_model, patch(
            "submit_api.services.account_user_service.TokenInfo"
        ) as mock_token, patch.object(
            AccountUserService, "get_users_by_account", return_value=[]
        ) as mock_get:
            mock_token.get_username.return_value = "admin-guid"
            mock_model.get_by_guid.return_value = account_user

            AccountUserService.get_users_by_account_projects(
                account_id=1, include_roles=True, include_invitees=True
            )

        mock_get.assert_called_once_with(
            1,
            include_roles=True,
            include_invitees=True,
        )

    def test_project_admin_is_scoped_not_full_access(self):
        """A project admin is scoped to their project(s), never full account access."""
        from submit_api.services.account_user_service import AccountUserService

        account_user = self._make_account_user_with_projects(
            [10], role_name="PROJECT_ADMIN"
        )

        with patch(
            "submit_api.services.account_user_service.AccountUserModel"
        ) as mock_model, patch(
            "submit_api.services.account_user_service.TokenInfo"
        ) as mock_token, patch.object(
            AccountUserService, "get_users_by_account", return_value=[]
        ) as mock_get:
            mock_token.get_username.return_value = "pa-guid"
            mock_model.get_by_guid.return_value = account_user

            AccountUserService.get_users_by_account_projects(
                account_id=1, include_roles=True, include_invitees=True
            )

        mock_get.assert_called_once_with(
            1,
            include_roles=True,
            include_invitees=True,
            account_project_ids=[10],
            exclude_account_admins=True,
        )

    def test_raises_when_user_not_found(self):
        """An unknown user is rejected rather than shown everything."""
        from submit_api.exceptions import PermissionDeniedError
        from submit_api.services.account_user_service import AccountUserService

        with patch(
            "submit_api.services.account_user_service.AccountUserModel"
        ) as mock_model, patch(
            "submit_api.services.account_user_service.TokenInfo"
        ) as mock_token:
            mock_token.get_username.return_value = "guid-unknown"
            mock_model.get_by_guid.return_value = None

            with pytest.raises(PermissionDeniedError):
                AccountUserService.get_users_by_account_projects(
                    account_id=1, include_roles=True, include_invitees=True
                )


class TestFetchInviteesScoping:
    """Tests scoping of pending invitations by the caller's project ids."""

    def test_returns_empty_when_scope_resolves_to_no_project_ids(self):
        """If a scope is supplied but resolves to no project ids, return no invitees."""
        from submit_api.services.account_user_service import AccountUserService

        with patch(
            "submit_api.services.account_user_service.AccountProjectModel"
        ) as mock_ap, patch(
            "submit_api.services.account_user_service.InvitationsModel"
        ) as mock_inv:
            mock_ap.get_project_ids_by_ids.return_value = []

            result = AccountUserService._fetch_invitees(
                account_id=1, include_roles=True, account_project_ids=[999]
            )

        assert result == []
        mock_inv.get_active_by_account_id.assert_not_called()

    def test_scopes_invitations_to_resolved_project_ids(self):
        """Invitations are fetched filtered by the resolved project ids."""
        from submit_api.services.account_user_service import AccountUserService

        with patch(
            "submit_api.services.account_user_service.AccountProjectModel"
        ) as mock_ap, patch(
            "submit_api.services.account_user_service.InvitationsModel"
        ) as mock_inv:
            mock_ap.get_project_ids_by_ids.return_value = [1]
            mock_inv.get_active_by_account_id.return_value = []

            AccountUserService._fetch_invitees(
                account_id=1, include_roles=True, account_project_ids=[10]
            )

        mock_inv.get_active_by_account_id.assert_called_once_with(1, [1])


class TestExcludeAccountAdmins:
    """Tests that non-admins never see the entity/account primary admin."""

    @staticmethod
    def _make_orm_user(role_name):
        """Build a mock ORM account user whose single active role has role_name."""
        user = MagicMock()
        role = MagicMock()
        role.role.role_name = role_name
        role.original_package_ids = None
        user.roles = [role]
        return user

    def test_get_users_by_account_filters_out_admin_users(self):
        """When exclude_account_admins is set, admin users are dropped from the list."""
        from submit_api.services.account_user_service import AccountUserService

        admin_user = self._make_orm_user("ACCOUNT_PRIMARY_ADMIN")
        pa_user = self._make_orm_user("PROJECT_ADMIN")

        with patch.object(
            AccountUserService, "_fetch_users", return_value=[admin_user, pa_user]
        ), patch.object(
            AccountUserService, "_collect_and_fetch_package_names", return_value={}
        ), patch.object(
            AccountUserService, "_process_user_data", side_effect=lambda user, _: user
        ):
            result = AccountUserService.get_users_by_account(
                account_id=1,
                include_roles=True,
                include_invitees=False,
                account_project_ids=[10],
                exclude_account_admins=True,
            )

        assert admin_user not in result
        assert pa_user in result

    def test_get_users_by_account_keeps_admin_when_not_excluded(self):
        """Without the flag (entity-admin viewer), admin users remain in the list."""
        from submit_api.services.account_user_service import AccountUserService

        admin_user = self._make_orm_user("ACCOUNT_PRIMARY_ADMIN")

        with patch.object(
            AccountUserService, "_fetch_users", return_value=[admin_user]
        ), patch.object(
            AccountUserService, "_collect_and_fetch_package_names", return_value={}
        ), patch.object(
            AccountUserService, "_process_user_data", side_effect=lambda user, _: user
        ):
            result = AccountUserService.get_users_by_account(
                account_id=1,
                include_roles=True,
                include_invitees=False,
            )

        assert admin_user in result

    def test_fetch_invitees_filters_out_admin_invitations(self):
        """Pending admin-role invitations are omitted when excluding admins."""
        from submit_api.services.account_user_service import AccountUserService

        admin_invite = MagicMock()
        admin_invite.role.role_name = "ACCOUNT_PRIMARY_ADMIN"
        admin_invite.original_package_ids = None

        pa_invite = MagicMock()
        pa_invite.role.role_name = "PROJECT_ADMIN"
        pa_invite.original_package_ids = None
        pa_invite.email = "pa@example.com"
        pa_invite.project_ids = [1]

        with patch(
            "submit_api.services.account_user_service.AccountProjectModel"
        ) as mock_ap, patch(
            "submit_api.services.account_user_service.InvitationsModel"
        ) as mock_inv:
            mock_ap.get_project_ids_by_ids.return_value = [1]
            mock_inv.get_active_by_account_id.return_value = [admin_invite, pa_invite]

            result = AccountUserService._fetch_invitees(
                account_id=1,
                include_roles=True,
                account_project_ids=[10],
                exclude_account_admins=True,
            )

        emails = [invitee["work_email_address"] for invitee in result]
        assert "pa@example.com" in emails
        assert len(result) == 1
