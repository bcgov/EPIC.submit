"""Tests for InvitationService.accept_invitation duplicate user handling."""
from unittest.mock import MagicMock, patch

import pytest

from submit_api.exceptions import ResourceExistsError
from submit_api.services.invitation_service import InvitationService


class TestAcceptInvitationDuplicateUser:
    """Tests for duplicate user detection in accept_invitation."""

    @pytest.fixture()
    def valid_payload(self):
        """Return a valid payload for accept_invitation."""
        return {
            "auth_guid": "existing-guid-123",
            "first_name": "John",
            "last_name": "Doe",
            "position": "Manager",
            "work_email_address": "john@example.com",
            "work_contact_number": "1234567890",
            "company_name": "Test Corp",
            "has_agreed_to_terms": True,
            "terms_of_service_version_id": 1,
        }

    @pytest.fixture()
    def mock_invitation(self):
        """Return a mock invitation object."""
        invitation = MagicMock()
        invitation.account_id = 1
        invitation.role_id = 1
        invitation.project_ids = [1]
        invitation.eligible_entries = None
        invitation.package_ids = []
        invitation.original_package_ids = []
        return invitation

    @patch("submit_api.services.invitation_service.TermsOfServiceModel")
    @patch("submit_api.services.invitation_service.InvitationsModel")
    @patch("submit_api.services.invitation_service.User")
    @patch("submit_api.services.invitation_service.session_scope")
    def test_accept_invitation_raises_conflict_when_user_exists(
        self, mock_session_scope, mock_user_class, mock_invitations_model, mock_terms_model,
        valid_payload, mock_invitation
    ):
        """Test that accept_invitation raises ResourceExistsError for duplicate auth_guid."""
        mock_invitations_model.validate_token.return_value = mock_invitation
        mock_terms_model.get_active_terms_of_service_by_version.return_value = MagicMock()

        mock_session = MagicMock()
        mock_session_scope.return_value.__enter__ = MagicMock(return_value=mock_session)
        mock_session_scope.return_value.__exit__ = MagicMock(return_value=False)

        # Simulate an existing user with the same auth_guid
        mock_user_class.get_by_guid.return_value = MagicMock()

        with pytest.raises(ResourceExistsError):
            InvitationService.accept_invitation("valid-token", valid_payload)

    @patch("submit_api.services.invitation_service.TermsOfServiceModel")
    @patch("submit_api.services.invitation_service.InvitationsModel")
    @patch("submit_api.services.invitation_service.User")
    def test_accept_invitation_proceeds_when_user_does_not_exist(
        self, mock_user_class, mock_invitations_model, mock_terms_model,
        valid_payload, mock_invitation
    ):
        """Test that accept_invitation does not raise when auth_guid is new."""
        mock_invitations_model.validate_token.return_value = mock_invitation
        mock_terms_model.get_active_terms_of_service_by_version.return_value = MagicMock()

        # No existing user
        mock_user_class.get_by_guid.return_value = None

        with patch("submit_api.services.invitation_service.session_scope") as mock_scope:
            mock_session = MagicMock()
            mock_scope.return_value.__enter__ = MagicMock(return_value=mock_session)
            mock_scope.return_value.__exit__ = MagicMock(return_value=False)

            with patch.object(InvitationService, "_create_user") as mock_create_user, \
                 patch.object(InvitationService, "_create_account_user") as mock_create_account_user, \
                 patch.object(InvitationService, "_get_project_ids_from_invitation") as mock_get_pids, \
                 patch.object(InvitationService, "get_or_create_account_projects"), \
                 patch("submit_api.services.invitation_service.AccountProjectModel") as mock_ap_model, \
                 patch.object(InvitationService, "_assign_user_role") as mock_assign_role, \
                 patch.object(InvitationService, "_process_eligible_entries") as mock_process, \
                 patch.object(InvitationService, "_create_default_package_if_needed"), \
                 patch.object(InvitationService, "_update_proponent_status_by_account"):

                mock_user = MagicMock()
                mock_user.id = 99
                mock_create_user.return_value = mock_user

                mock_account_user = MagicMock()
                mock_account_user.user_id = 99
                mock_account_user.id = 10
                mock_create_account_user.return_value = mock_account_user

                mock_get_pids.return_value = [1]

                mock_ap = MagicMock()
                mock_ap.id = 1
                mock_ap.project_id = 1
                mock_ap_model.get_all_in_project_ids.return_value = [mock_ap]

                mock_assign_role.return_value = {
                    "role_id": 1,
                    "role_name": "admin",
                    "permissions": [],
                    "account_project_id": 1,
                    "package_ids": [],
                    "original_package_ids": [],
                }
                mock_process.return_value = []

                mock_invitations_model.mark_used.return_value = None

                result = InvitationService.accept_invitation("valid-token", valid_payload)

                assert "user_id" in result
                assert result["user_id"] == 99
                mock_create_user.assert_called_once()
