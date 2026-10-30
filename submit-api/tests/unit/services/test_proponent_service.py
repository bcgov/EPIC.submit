"""Unit tests for the ProponentService administrator contact building."""
from unittest.mock import Mock, patch

from submit_api.enums.role import RoleEnum
from submit_api.services.proponent_service import ProponentService


def _user_role(role_name, active=True, role_id=1, account_project_id=None):
    """Build a mock UserRole with the given role name and active flag."""
    user_role = Mock()
    user_role.active = active
    user_role.account_project_id = account_project_id
    user_role.role_id = role_id
    user_role.role = Mock()
    user_role.role.id = role_id
    user_role.role.role_name = role_name
    return user_role


def _account_user(roles, user_id=1, **overrides):
    """Build a mock AccountUser with the given active roles."""
    user = Mock()
    user.id = overrides.get("id", 10)
    user.user_id = user_id
    user.first_name = overrides.get("first_name", "Ada")
    user.last_name = overrides.get("last_name", "Lovelace")
    user.full_name = overrides.get("full_name", "Ada Lovelace")
    user.position = overrides.get("position", "Administrator")
    user.company_name = overrides.get("company_name", "Analytical Engines Ltd")
    user.work_contact_number = overrides.get("work_contact_number", "250-555-0100")
    user.work_email_address = overrides.get("work_email_address", "ada@example.com")
    user.roles = roles
    return user


class TestBuildAdministrators:
    """Tests for ProponentService._build_administrators."""

    def test_returns_active_primary_admin(self):
        """An active account primary admin is included with contact details."""
        user = _account_user([_user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)])

        administrators = ProponentService._build_administrators([user])

        assert len(administrators) == 1
        admin = administrators[0]
        assert admin["full_name"] == "Ada Lovelace"
        assert admin["work_email_address"] == "ada@example.com"
        assert admin["work_contact_number"] == "250-555-0100"
        assert admin["company_name"] == "Analytical Engines Ltd"

    def test_admin_with_multiple_roles_included(self):
        """A user is included when any active role is the primary admin role."""
        user = _account_user([
            _user_role(RoleEnum.PROJECT_ADMIN.value),
            _user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value),
        ])

        administrators = ProponentService._build_administrators([user])

        assert len(administrators) == 1

    def test_non_primary_admin_excluded(self):
        """A user without the primary admin role is not treated as an administrator."""
        user = _account_user([_user_role(RoleEnum.PROJECT_ADMIN.value)])

        administrators = ProponentService._build_administrators([user])

        assert administrators == []

    def test_inactive_primary_admin_role_excluded(self):
        """A primary admin role that is inactive does not qualify the user."""
        user = _account_user(
            [_user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, active=False)]
        )

        administrators = ProponentService._build_administrators([user])

        assert administrators == []

    def test_user_without_user_id_excluded(self):
        """An account user that has not linked a user account is excluded."""
        user = _account_user(
            [_user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)], user_id=None
        )

        administrators = ProponentService._build_administrators([user])

        assert administrators == []

    def test_user_without_roles_excluded(self):
        """An account user with no active roles is excluded."""
        user = _account_user([])

        administrators = ProponentService._build_administrators([user])

        assert administrators == []


class TestAssignAdminRoles:
    """Tests for ProponentService._assign_admin_roles."""

    def test_admin_role_assigned_to_new_project(self):
        """A primary admin gets a user_role created for the newly added project."""
        user = _account_user(
            [_user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, role_id=5, account_project_id=1)]
        )
        account_project = Mock()
        account_project.id = 99
        session = Mock()

        with patch(
            "submit_api.services.proponent_service.AccountUserService.assign_role"
        ) as assign_role:
            ProponentService._assign_admin_roles([user], account_project, session)

        assign_role.assert_called_once_with(
            {
                "account_user_id": user.id,
                "role_id": 5,
                "account_project_id": 99,
            },
            session,
        )

    def test_project_admin_role_assigned_to_new_project(self):
        """A project admin also gets a user_role created for the new project."""
        user = _account_user(
            [_user_role(RoleEnum.PROJECT_ADMIN.value, role_id=6, account_project_id=1)]
        )
        account_project = Mock()
        account_project.id = 42
        session = Mock()

        with patch(
            "submit_api.services.proponent_service.AccountUserService.assign_role"
        ) as assign_role:
            ProponentService._assign_admin_roles([user], account_project, session)

        assign_role.assert_called_once()
        assert assign_role.call_args.args[0]["account_project_id"] == 42

    def test_non_admin_role_not_assigned(self):
        """A user without an admin role is skipped (no user_role created)."""
        user = _account_user(
            [_user_role(RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value, role_id=7)]
        )
        account_project = Mock()
        account_project.id = 42
        session = Mock()

        with patch(
            "submit_api.services.proponent_service.AccountUserService.assign_role"
        ) as assign_role:
            ProponentService._assign_admin_roles([user], account_project, session)

        assign_role.assert_not_called()

    def test_inactive_admin_role_not_assigned(self):
        """An inactive admin role does not trigger a new user_role."""
        user = _account_user(
            [_user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, active=False, role_id=5)]
        )
        account_project = Mock()
        account_project.id = 42
        session = Mock()

        with patch(
            "submit_api.services.proponent_service.AccountUserService.assign_role"
        ) as assign_role:
            ProponentService._assign_admin_roles([user], account_project, session)

        assign_role.assert_not_called()

    def test_existing_active_role_not_duplicated(self):
        """No new user_role is created when one already exists for the project."""
        user = _account_user([
            _user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, role_id=5, account_project_id=1),
            _user_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, role_id=5, account_project_id=42),
        ])
        account_project = Mock()
        account_project.id = 42
        session = Mock()

        with patch(
            "submit_api.services.proponent_service.AccountUserService.assign_role"
        ) as assign_role:
            ProponentService._assign_admin_roles([user], account_project, session)

        assign_role.assert_not_called()
