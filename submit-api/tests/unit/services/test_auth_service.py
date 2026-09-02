"""Unit tests for AuthService."""
from __future__ import annotations

from unittest.mock import Mock, patch

import pytest
import requests

from submit_api.services.auth_service import AuthService, _request_auth_service


SERVICE_ACCOUNT_TOKEN = "service-account-token-123"


@pytest.fixture()
def mock_app():
    """Create a minimal Flask app context for testing."""
    from flask import Flask

    app = Flask(__name__)
    app.config["AUTH_BASE_URL"] = "http://auth-api:5000"
    return app


@pytest.fixture()
def mock_request_headers():
    """Return mock headers with an incoming user Authorization header."""
    return {"Authorization": "Bearer user-token-123"}


@pytest.fixture(autouse=True)
def mock_service_account_token():
    """Patch the service account token used to call epic.auth."""
    with patch(
        "submit_api.services.auth_service.KeycloakTokenService."
        "get_service_account_token",
        return_value=SERVICE_ACCOUNT_TOKEN,
    ) as mock_token:
        yield mock_token


class TestGetUserByEmail:
    """Tests for AuthService.get_user_by_email."""

    @patch("submit_api.services.auth_service.requests.get")
    def test_success(self, mock_get, mock_app, mock_request_headers):
        """Test successful email lookup."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "kc-uuid",
            "username": "testuser",
            "email_address": "test@gov.bc.ca",
        }
        mock_get.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            result = AuthService.get_user_by_email("test@gov.bc.ca")

        assert result["username"] == "testuser"
        mock_get.assert_called_once()
        call_url = mock_get.call_args[0][0]
        assert "users/email/test@gov.bc.ca" in call_url

    @patch("submit_api.services.auth_service.requests.get")
    def test_not_found(self, mock_get, mock_app, mock_request_headers):
        """Test 404 raises ResourceNotFoundError."""
        from submit_api.exceptions import ResourceNotFoundError

        mock_response = Mock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            with pytest.raises(ResourceNotFoundError):
                AuthService.get_user_by_email("nobody@gov.bc.ca")


class TestGetUserByUsername:
    """Tests for AuthService.get_user_by_username."""

    @patch("submit_api.services.auth_service.requests.get")
    def test_success(self, mock_get, mock_app, mock_request_headers):
        """Test successful username lookup."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "kc-uuid",
            "username": "johndoe",
        }
        mock_get.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            result = AuthService.get_user_by_username("johndoe")

        assert result["username"] == "johndoe"


class TestGetUserGroups:
    """Tests for AuthService.get_user_groups."""

    @patch("submit_api.services.auth_service.requests.get")
    def test_success(self, mock_get, mock_app, mock_request_headers):
        """Test successful group retrieval."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"id": "g1", "name": "SUBMIT", "path": "SUBMIT"}
        ]
        mock_get.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            result = AuthService.get_user_groups("testuser")

        assert len(result) == 1
        assert result[0]["name"] == "SUBMIT"

    @patch("submit_api.services.auth_service.requests.get")
    def test_not_found_returns_empty(self, mock_get, mock_app, mock_request_headers):
        """Test 404 returns empty list instead of raising."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            result = AuthService.get_user_groups("unknown")

        assert result == []


class TestUpdateUserGroup:
    """Tests for AuthService.update_user_group."""

    @patch("submit_api.services.auth_service.requests.put")
    def test_with_subgroup(self, mock_put, mock_app, mock_request_headers):
        """Test successful group assignment with sub_group_name."""
        mock_response = Mock()
        mock_response.status_code = 204
        mock_put.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            response = AuthService.update_user_group(
                "testuser", "SUBMIT", "EAO_MANAGER"
            )

        assert response.status_code == 204
        call_url = mock_put.call_args[0][0]
        assert "users/testuser/groups/SUBMIT" in call_url
        assert "sub_group_name=EAO_MANAGER" in call_url

    @patch("submit_api.services.auth_service.requests.put")
    def test_without_subgroup(self, mock_put, mock_app, mock_request_headers):
        """Test group assignment without sub_group_name."""
        mock_response = Mock()
        mock_response.status_code = 204
        mock_put.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            AuthService.update_user_group("testuser", "SUBMIT")

        call_url = mock_put.call_args[0][0]
        assert "sub_group_name" not in call_url


class TestDeleteUserGroup:
    """Tests for AuthService.delete_user_group."""

    @patch("submit_api.services.auth_service.requests.delete")
    def test_success(self, mock_delete, mock_app, mock_request_headers):
        """Test successful group removal."""
        mock_response = Mock()
        mock_response.status_code = 204
        mock_delete.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            response = AuthService.delete_user_group("testuser", "EAO_MANAGER")

        assert response.status_code == 204
        call_url = mock_delete.call_args[0][0]
        assert "users/testuser/groups/EAO_MANAGER" in call_url
        assert "del_sub_group_mappings=True" in call_url


class TestToggleUserEnabledStatus:
    """Tests for AuthService.toggle_user_enabled_status."""

    @patch("submit_api.services.auth_service.requests.patch")
    def test_disable_user(self, mock_patch, mock_app, mock_request_headers):
        """Test disabling a user."""
        mock_response = Mock()
        mock_response.status_code = 204
        mock_patch.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            response = AuthService.toggle_user_enabled_status("testuser", False)

        assert response.status_code == 204
        call_kwargs = mock_patch.call_args[1]
        assert call_kwargs["json"] == {"enabled": False}

    @patch("submit_api.services.auth_service.requests.patch")
    def test_enable_user(self, mock_patch, mock_app, mock_request_headers):
        """Test enabling a user."""
        mock_response = Mock()
        mock_response.status_code = 204
        mock_patch.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            response = AuthService.toggle_user_enabled_status("testuser", True)

        assert response.status_code == 204
        call_kwargs = mock_patch.call_args[1]
        assert call_kwargs["json"] == {"enabled": True}


class TestGetGroupMembers:
    """Tests for AuthService.get_group_members."""

    @patch("submit_api.services.auth_service.requests.get")
    def test_with_subgroup(self, mock_get, mock_app, mock_request_headers):
        """Test getting members with sub_group_name."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"id": "u1", "first_name": "Jane", "email": "jane@gov.bc.ca"}
        ]
        mock_get.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            result = AuthService.get_group_members("SUBMIT", "EAO_MANAGER")

        assert len(result) == 1
        call_url = mock_get.call_args[0][0]
        assert "users/groups/SUBMIT/members" in call_url
        assert "sub_group_name=EAO_MANAGER" in call_url


class TestRequestAuthServiceHeaders:
    """Tests for _request_auth_service header handling."""

    @patch("submit_api.services.auth_service.requests.get")
    def test_uses_service_account_token(
        self, mock_get, mock_app, mock_request_headers
    ):
        """Test that the service account token is used, not the user token."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_get.return_value = mock_response

        with mock_app.test_request_context(headers=mock_request_headers):
            _request_auth_service("users")

        call_kwargs = mock_get.call_args[1]
        assert call_kwargs["headers"]["App-Id"] == "SUBMIT"
        assert (
            call_kwargs["headers"]["Authorization"]
            == f"Bearer {SERVICE_ACCOUNT_TOKEN}"
        )

    @patch("submit_api.services.auth_service.requests.get")
    def test_no_request_context_still_uses_service_account(
        self, mock_get, mock_app
    ):
        """Test that calls work outside a user request context."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_get.return_value = mock_response

        with mock_app.app_context():
            _request_auth_service("users")

        call_kwargs = mock_get.call_args[1]
        assert (
            call_kwargs["headers"]["Authorization"]
            == f"Bearer {SERVICE_ACCOUNT_TOKEN}"
        )

    def test_no_token_raises_error(
        self, mock_app, mock_service_account_token
    ):
        """Test that a missing service account token raises BusinessError."""
        from submit_api.exceptions import BusinessError

        mock_service_account_token.return_value = None

        with mock_app.app_context():
            with pytest.raises(BusinessError):
                _request_auth_service("users")

    def test_token_retrieval_failure_raises_error(
        self, mock_app, mock_service_account_token
    ):
        """Test that a token retrieval failure raises BusinessError."""
        from submit_api.exceptions import BusinessError

        mock_service_account_token.side_effect = (
            requests.exceptions.ConnectionError("Connection refused")
        )

        with mock_app.app_context():
            with pytest.raises(BusinessError):
                _request_auth_service("users")

    @patch("submit_api.services.auth_service.requests.get")
    def test_service_unavailable(self, mock_get, mock_app, mock_request_headers):
        """Test that connection error raises BusinessError."""
        from submit_api.exceptions import BusinessError

        mock_get.side_effect = requests.exceptions.ConnectionError(
            "Connection refused"
        )

        with mock_app.test_request_context(headers=mock_request_headers):
            with pytest.raises(BusinessError):
                _request_auth_service("users")
