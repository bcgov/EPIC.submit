"""Unit tests for the role check on package acknowledgement and approval.

Acknowledge and approve share one rule: only w_extended_edit or full_access users
may perform them. A gis_extended_edit user is only allowed when they also hold one
of those roles.
"""
from contextlib import contextmanager
from unittest.mock import Mock, patch

import pytest
from werkzeug.exceptions import Forbidden

from submit_api.enums.package_type import PackageApprovalType
from submit_api.models.package import PackageStatus
from submit_api.services import authorization
from submit_api.services.package_service import PackageService


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Patch current_app so service logger calls work without an app context."""
    with patch("submit_api.services.package_service.current_app", new=Mock()):
        yield


@contextmanager
def _fake_session_scope():
    """Yield a mock session that behaves like the real session_scope contextmanager."""
    yield Mock()


def _package(approval_type=PackageApprovalType.A):
    """Build a mock package with no items."""
    package = Mock()
    package.id = 1
    package.type.approval_type = approval_type
    package.items = []
    package.status = []
    return package


def _jwt_with_roles(roles):
    """Return a jwt mock whose contains_role matches any of the given roles."""
    mock_jwt = Mock()
    mock_jwt.contains_role.side_effect = lambda required: any(role in roles for role in required)
    return mock_jwt


class TestRequireTeamLeadAccess:
    """Tests for authorization.require_team_lead_access."""

    @pytest.mark.parametrize("roles", [
        ["w_extended_edit"],
        ["full_access"],
        ["w_extended_edit", "gis_extended_edit"],
        ["full_access", "gis_extended_edit"],
    ])
    def test_allows_w_extended_edit_or_full_access(self, roles):
        """Users with w_extended_edit or full_access pass, with or without the GIS role."""
        with patch.object(authorization, "jwt", _jwt_with_roles(roles)):
            authorization.require_team_lead_access()

    @pytest.mark.parametrize("roles", [["gis_extended_edit"], ["eao_view"], []])
    def test_forbids_other_roles(self, roles):
        """Users without w_extended_edit or full_access get a 403."""
        with patch.object(authorization, "jwt", _jwt_with_roles(roles)):
            with pytest.raises(Forbidden):
                authorization.require_team_lead_access()


class TestAcknowledgePackagePermission:
    """Tests for the role check in PackageService.acknowledge_package."""

    @patch("submit_api.services.package_service.SubmitEmailQueueService")
    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch("submit_api.services.package_service.authorization.require_team_lead_access")
    @patch.object(PackageService, "get_package_by_id")
    def test_acknowledge_checks_team_lead_access(self, mock_get, mock_auth, _mock_email):
        """Acknowledging calls the team lead check and then acknowledges the package."""
        mock_get.return_value = _package()

        result = PackageService.acknowledge_package(1)

        mock_auth.assert_called_once_with()
        assert result.status == [PackageStatus.ACKNOWLEDGED.value]

    @patch("submit_api.services.package_service.session_scope", _fake_session_scope)
    @patch(
        "submit_api.services.package_service.authorization.require_team_lead_access",
        side_effect=Forbidden(),
    )
    @patch.object(PackageService, "get_package_by_id")
    def test_acknowledge_forbidden_without_role(self, mock_get, _mock_auth):
        """A user without the required role is rejected before the package is loaded."""
        with pytest.raises(Forbidden):
            PackageService.acknowledge_package(1)

        mock_get.assert_not_called()
