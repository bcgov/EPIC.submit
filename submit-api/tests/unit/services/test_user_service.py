"""Tests for UserService last-login stamping behaviour."""
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.exc import SQLAlchemyError

import submit_api.services.user_service as user_service_module
from submit_api.models.user import UserType
from submit_api.models.user_status import UserStatusEnum
from submit_api.services.user_service import UserService


@pytest.fixture(autouse=True)
def mock_current_app():
    """Patch current_app so logging calls don't need an app context."""
    mock_app = MagicMock()
    with patch.object(user_service_module, "current_app", mock_app):
        yield mock_app


def _proponent_user(status_id=UserStatusEnum.ACTIVE.value):
    """Build a mock PROPONENT user with an account_user."""
    user = MagicMock()
    user.id = 1
    user.type = UserType.PROPONENT
    user.status_id = status_id
    user.account_user = MagicMock()
    return user


def _staff_user():
    """Build a mock STAFF user without an account_user."""
    user = MagicMock()
    user.id = 2
    user.type = UserType.STAFF
    user.account_user = None
    return user


class TestRecordProponentLogin:
    """Tests for UserService._record_proponent_login."""

    def test_stamps_last_login_for_proponent(self):
        """A proponent with an account_user has touch_last_login called once."""
        user = _proponent_user()

        UserService._record_proponent_login(user)

        user.account_user.touch_last_login.assert_called_once_with()

    def test_does_not_stamp_for_staff(self):
        """A staff user (no account_user) is never stamped."""
        user = _staff_user()

        UserService._record_proponent_login(user)

        # No account_user to stamp; nothing raised, nothing called.
        assert user.account_user is None

    def test_proponent_without_account_user_is_noop(self):
        """A proponent lacking an account_user record is a safe no-op."""
        user = MagicMock()
        user.type = UserType.PROPONENT
        user.account_user = None

        # Should simply return without raising.
        UserService._record_proponent_login(user)

    def test_reactivates_inactive_proponent_on_login(self):
        """An INACTIVE proponent is flipped back to ACTIVE when logging in."""
        user = _proponent_user(status_id=UserStatusEnum.INACTIVE.value)

        with patch.object(user_service_module, "db") as mock_db:
            UserService._record_proponent_login(user)
            mock_db.session.add.assert_called_once_with(user)

        assert user.status_id == UserStatusEnum.ACTIVE.value
        user.account_user.touch_last_login.assert_called_once_with()

    def test_active_proponent_status_unchanged(self):
        """An already-ACTIVE proponent keeps ACTIVE and is only stamped."""
        user = _proponent_user(status_id=UserStatusEnum.ACTIVE.value)

        UserService._record_proponent_login(user)

        assert user.status_id == UserStatusEnum.ACTIVE.value
        user.account_user.touch_last_login.assert_called_once_with()

    def test_revoked_proponent_is_not_reactivated(self):
        """An ACCESS_REVOKED proponent is never auto-reactivated by login."""
        user = _proponent_user(status_id=UserStatusEnum.ACCESS_REVOKED.value)

        UserService._record_proponent_login(user)

        assert user.status_id == UserStatusEnum.ACCESS_REVOKED.value

    def test_stamp_failure_is_swallowed(self):
        """A DB error while stamping is rolled back and never propagated."""
        user = _proponent_user()
        user.account_user.touch_last_login.side_effect = SQLAlchemyError("boom")

        with patch.object(user_service_module, "db") as mock_db:
            # Must not raise despite the underlying failure.
            UserService._record_proponent_login(user)
            mock_db.session.rollback.assert_called_once_with()


class TestGetOrProvisionStampsLogin:
    """get_or_provision_by_auth_guid should stamp login for a resolved proponent."""

    def test_get_or_provision_stamps_proponent_login(self):
        """Resolving an existing proponent stamps last_login_at before returning."""
        user = _proponent_user()

        with patch.object(user_service_module.User, "get_by_guid", return_value=user):
            result = UserService.get_or_provision_by_auth_guid("guid-123")

        assert result is user
        user.account_user.touch_last_login.assert_called_once_with()
