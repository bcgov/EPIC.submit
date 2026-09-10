"""Unit tests for the ProponentService administrator contact building."""
from unittest.mock import Mock

from submit_api.enums.role import RoleEnum
from submit_api.services.proponent_service import ProponentService


def _user_role(role_name, active=True):
    """Build a mock UserRole with the given role name and active flag."""
    user_role = Mock()
    user_role.active = active
    user_role.role = Mock()
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
