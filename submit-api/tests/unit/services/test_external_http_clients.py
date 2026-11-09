"""Service-level unit tests for the external HTTP clients and the email details data class."""
from unittest.mock import Mock, patch

import pytest
import requests

from submit_api.data_classes.email_details import EmailDetails
from submit_api.services.condition_api_client import ConditionApiClient
from submit_api.services.document_service_client import DocumentServiceClient
from submit_api.services.keycloak_token_service import KeycloakTokenService


DOC = "submit_api.services.document_service_client"


def _response(json_data=None, status_error=None):
    """Build a fake requests response."""
    response = Mock()
    response.json.return_value = json_data
    response.raise_for_status.side_effect = status_error
    return response


class TestKeycloakTokenService:
    """Tests for KeycloakTokenService."""

    def test_returns_access_token(self, app):
        """The access token from the token endpoint is returned."""
        with patch("submit_api.services.keycloak_token_service.requests.post",
                   return_value=_response({"access_token": "abc"})) as post:
            assert KeycloakTokenService.get_service_account_token() == "abc"
        assert "openid-connect/token" in post.call_args.args[0]

    def test_http_error_is_raised(self, app):
        """HTTP errors from Keycloak propagate."""
        failing = _response(status_error=requests.HTTPError("401"))
        with patch("submit_api.services.keycloak_token_service.requests.post", return_value=failing):
            with pytest.raises(requests.HTTPError):
                KeycloakTokenService.get_service_account_token()


class TestConditionApiClient:
    """Tests for ConditionApiClient."""

    def test_returns_reports(self, app):
        """Reports are read from the response body."""
        with patch.dict(app.config, {"CONDITION_API_BASE_URL": "https://conditions"}), \
                patch("submit_api.services.condition_api_client.KeycloakTokenService.get_service_account_token",
                      return_value="tok"), \
                patch("submit_api.services.condition_api_client.requests.get",
                      return_value=_response({"reports": [{"id": 1}]})) as get:
            assert ConditionApiClient.get_approved_reports_by_project("guid") == [{"id": 1}]
        assert get.call_args.args[0] == "https://conditions/api/reports/project/guid"

    def test_empty_body_returns_empty_list(self, app):
        """A null body yields no reports."""
        with patch.dict(app.config, {"CONDITION_API_BASE_URL": "https://conditions"}), \
                patch("submit_api.services.condition_api_client.KeycloakTokenService.get_service_account_token",
                      return_value="tok"), \
                patch("submit_api.services.condition_api_client.requests.get", return_value=_response(None)):
            assert ConditionApiClient.get_approved_reports_by_project("guid") == []

    def test_missing_base_url_raises(self, app):
        """A missing base URL is a configuration error."""
        with patch.dict(app.config, {"CONDITION_API_BASE_URL": None}):
            with pytest.raises(ValueError):
                ConditionApiClient.get_approved_reports_by_project("guid")


class TestDocumentServiceClient:
    """Tests for DocumentServiceClient."""

    def test_get_token_prefers_user_context(self, app):
        """The bearer token from the request context is used when present."""
        with patch(f"{DOC}.UserContext") as context:
            context.return_value.bearer_token = "user-token"
            assert DocumentServiceClient._get_token() == "user-token"

    def test_get_token_falls_back_to_service_account(self, app):
        """Without a user token the service account token is used."""
        with patch(f"{DOC}.UserContext", side_effect=RuntimeError("no request")), \
                patch(f"{DOC}.KeycloakTokenService.get_service_account_token", return_value="svc"):
            assert DocumentServiceClient._get_token() == "svc"

    def test_presigned_urls(self, app):
        """Read, write and delete URLs are requested with the matching action."""
        body = {"presigned_url": "https://signed", "relative_url": "actual/key"}
        with patch.dict(app.config, {"DOCUMENT_SERVICE_URL": "https://docs"}), \
                patch.object(DocumentServiceClient, "_get_token", return_value="tok"), \
                patch(f"{DOC}.requests.post", return_value=_response(body)) as post:
            assert DocumentServiceClient.get_presigned_read_url("k") == "https://signed"
            assert DocumentServiceClient.get_presigned_write_url("k") == ("https://signed", "actual/key")
            assert DocumentServiceClient.get_presigned_delete_url("k") == "https://signed"
        assert [call.kwargs["json"]["action"] for call in post.call_args_list] == ["GET", "PUT", "DELETE"]

    def test_presigned_url_requires_configuration(self, app):
        """A missing document service URL is a configuration error."""
        with patch.dict(app.config, {"DOCUMENT_SERVICE_URL": None}):
            with pytest.raises(ValueError):
                DocumentServiceClient.get_presigned_read_url("k")

    def test_presigned_url_missing_in_response(self, app):
        """A response without a presigned URL is an error."""
        with patch.dict(app.config, {"DOCUMENT_SERVICE_URL": "https://docs"}), \
                patch.object(DocumentServiceClient, "_get_token", return_value="tok"), \
                patch(f"{DOC}.requests.post", return_value=_response({})):
            with pytest.raises(ValueError):
                DocumentServiceClient.get_presigned_read_url("k")

    def test_upload_download_and_delete_via_presigned_url(self, app, tmp_path):
        """Raw bytes can be uploaded, downloaded and deleted via presigned URLs."""
        download = _response()
        download.iter_content.return_value = [b"ab", b"cd"]
        target = tmp_path / "out.bin"

        with patch(f"{DOC}.requests.put", return_value=_response()) as put, \
                patch(f"{DOC}.requests.get", return_value=download), \
                patch(f"{DOC}.requests.delete", return_value=_response()) as delete:
            DocumentServiceClient.upload_via_presigned_url("https://signed", b"data")
            assert DocumentServiceClient.download_via_presigned_url("https://signed", str(target)) == str(target)
            DocumentServiceClient.delete_via_presigned_url("https://signed")

        assert put.call_args.kwargs["data"] == b"data"
        assert target.read_bytes() == b"abcd"
        delete.assert_called_once()


class TestEmailDetails:
    """Tests for the EmailDetails data class."""

    def test_defaults_are_initialised(self):
        """Optional collections default to empty values."""
        details = EmailDetails(sender="a@x.ca", recipients=["b@x.ca"], subject="Hi")
        assert details.body_args == {}
        assert details.cc == []
        assert details.bcc == []

    def test_explicit_values_are_kept(self):
        """Provided values are preserved."""
        details = EmailDetails("a@x.ca", ["b@x.ca"], "Hi", body="x", cc=["c@x.ca"], body_args={"k": 1})
        assert details.cc == ["c@x.ca"]
        assert details.body_args == {"k": 1}
