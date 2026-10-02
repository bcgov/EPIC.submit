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


class TestAcceptInvitationSubmissionAdminScoping:
    """Collaborator - All Submissions in Project(s) is scoped per selected project."""

    @pytest.fixture()
    def valid_payload(self):
        """Return a valid payload for accept_invitation."""
        return {
            "auth_guid": "new-collab-guid",
            "first_name": "Casey",
            "last_name": "Collab",
            "position": "Analyst",
            "work_email_address": "casey@example.com",
            "work_contact_number": "5551234567",
            "company_name": "Test Corp",
            "has_agreed_to_terms": True,
            "terms_of_service_version_id": 1,
        }

    @pytest.fixture()
    def submission_admin_invitation(self):
        """Return a mock SUBMISSION_ADMIN invitation scoped to two projects."""
        invitation = MagicMock()
        invitation.account_id = 1
        invitation.role_id = 3
        invitation.project_ids = [101, 102]
        invitation.eligible_entries = None
        invitation.package_ids = []
        invitation.original_package_ids = None
        return invitation

    @patch("submit_api.services.invitation_service.TermsOfServiceModel")
    @patch("submit_api.services.invitation_service.InvitationsModel")
    @patch("submit_api.services.invitation_service.User")
    def test_creates_one_role_per_selected_project(
        self, mock_user_class, mock_invitations_model, mock_terms_model,
        valid_payload, submission_admin_invitation
    ):
        """A role is assigned for every selected project and none for others."""
        mock_invitations_model.validate_token.return_value = submission_admin_invitation
        mock_terms_model.get_active_terms_of_service_by_version.return_value = MagicMock()
        mock_user_class.get_by_guid.return_value = None

        with patch("submit_api.services.invitation_service.session_scope") as mock_scope:
            mock_session = MagicMock()
            mock_scope.return_value.__enter__ = MagicMock(return_value=mock_session)
            mock_scope.return_value.__exit__ = MagicMock(return_value=False)

            with patch.object(InvitationService, "_create_user") as mock_create_user, \
                 patch.object(InvitationService, "_create_account_user") as mock_create_account_user, \
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

                # Two account projects for the two selected project ids.
                ap1 = MagicMock()
                ap1.id = 1
                ap1.project_id = 101
                ap2 = MagicMock()
                ap2.id = 2
                ap2.project_id = 102
                mock_ap_model.get_all_in_project_ids.return_value = [ap1, ap2]

                mock_assign_role.return_value = {
                    "role_id": 3,
                    "role_name": "SUBMISSION_ADMIN",
                    "permissions": [],
                    "account_project_id": 1,
                    "package_ids": [],
                    "original_package_ids": None,
                }
                mock_process.return_value = []

                result = InvitationService.accept_invitation("token", valid_payload)

                # One role assignment per selected project (2), and only for those.
                assert mock_assign_role.call_count == 2
                assigned_account_project_ids = sorted(
                    call.args[1] for call in mock_assign_role.call_args_list
                )
                assert assigned_account_project_ids == [1, 2]
                assert len(result["roles"]) == 2


class TestCreateDefaultPackageIfNeeded:
    """Dynamic, idempotent creation of mandatory default packages per work phase."""

    @staticmethod
    def _make_account_project_work(apw_id, phase_id, enable_submit):
        """Build a mock account project work whose work sits in a given phase."""
        phase = MagicMock()
        phase.id = phase_id
        phase.enable_submit = enable_submit

        work = MagicMock()
        work.current_phase = phase

        account_project_work = MagicMock()
        account_project_work.id = apw_id
        account_project_work.work = work
        return account_project_work

    @staticmethod
    def _make_package_type(type_id, name, mandatory, title=None):
        """Build a mock package type."""
        package_type = MagicMock()
        package_type.id = type_id
        package_type.name = name
        package_type.title = title
        package_type.mandatory = mandatory
        return package_type

    @patch("submit_api.services.invitation_service.PackageService")
    @patch("submit_api.services.invitation_service.PackageModel")
    @patch("submit_api.services.invitation_service.PackageTypeModel")
    def test_creates_mandatory_package_when_phase_enabled(
        self, mock_package_type_model, mock_package_model, mock_package_service
    ):
        """A mandatory package type for a submit-enabled phase is created once."""
        account_project = MagicMock()
        account_project.id = 7
        apw = self._make_account_project_work(apw_id=20, phase_id=5, enable_submit=True)

        ipd_type = self._make_package_type(
            type_id=3, name="IPD", mandatory=True,
            title="Initial Project Description & Engagement Plan"
        )
        mock_package_type_model.find_by_phase_id.return_value = [ipd_type]
        mock_package_model.exists_for_work_and_type.return_value = False

        InvitationService._create_default_package_if_needed([apw], account_project)

        mock_package_type_model.find_by_phase_id.assert_called_once_with(5)
        mock_package_model.exists_for_work_and_type.assert_called_once_with(20, 3)
        mock_package_service.create_first_package.assert_called_once()
        account_project_id_arg, request_data = mock_package_service.create_first_package.call_args.args
        assert account_project_id_arg == 7
        assert request_data["type"] == "IPD"
        assert request_data["name"] == "Initial Project Description & Engagement Plan"
        assert request_data["account_project_work_id"] == 20

    @patch("submit_api.services.invitation_service.PackageService")
    @patch("submit_api.services.invitation_service.PackageModel")
    @patch("submit_api.services.invitation_service.PackageTypeModel")
    def test_skips_when_package_already_created(
        self, mock_package_type_model, mock_package_model, mock_package_service
    ):
        """An existing mandatory package is not created again (idempotent)."""
        account_project = MagicMock()
        account_project.id = 7
        apw = self._make_account_project_work(apw_id=20, phase_id=5, enable_submit=True)

        ipd_type = self._make_package_type(type_id=3, name="IPD", mandatory=True)
        mock_package_type_model.find_by_phase_id.return_value = [ipd_type]
        mock_package_model.exists_for_work_and_type.return_value = True

        InvitationService._create_default_package_if_needed([apw], account_project)

        mock_package_model.exists_for_work_and_type.assert_called_once_with(20, 3)
        mock_package_service.create_first_package.assert_not_called()

    @patch("submit_api.services.invitation_service.PackageService")
    @patch("submit_api.services.invitation_service.PackageModel")
    @patch("submit_api.services.invitation_service.PackageTypeModel")
    def test_skips_when_phase_not_submit_enabled(
        self, mock_package_type_model, mock_package_model, mock_package_service
    ):
        """No package types are inspected when the phase is not submit-enabled."""
        account_project = MagicMock()
        account_project.id = 7
        apw = self._make_account_project_work(apw_id=20, phase_id=5, enable_submit=False)

        InvitationService._create_default_package_if_needed([apw], account_project)

        mock_package_type_model.find_by_phase_id.assert_not_called()
        mock_package_service.create_first_package.assert_not_called()

    @patch("submit_api.services.invitation_service.PackageService")
    @patch("submit_api.services.invitation_service.PackageModel")
    @patch("submit_api.services.invitation_service.PackageTypeModel")
    def test_skips_non_mandatory_package_types(
        self, mock_package_type_model, mock_package_model, mock_package_service
    ):
        """Non-mandatory package types for the phase are ignored."""
        account_project = MagicMock()
        account_project.id = 7
        apw = self._make_account_project_work(apw_id=20, phase_id=5, enable_submit=True)

        optional_type = self._make_package_type(type_id=4, name="OPTIONAL", mandatory=False)
        mock_package_type_model.find_by_phase_id.return_value = [optional_type]

        InvitationService._create_default_package_if_needed([apw], account_project)

        mock_package_model.exists_for_work_and_type.assert_not_called()
        mock_package_service.create_first_package.assert_not_called()
