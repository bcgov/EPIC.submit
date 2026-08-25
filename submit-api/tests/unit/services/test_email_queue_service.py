"""Tests for Submit email queue helpers."""
from types import SimpleNamespace

import pytest

from submit_api.enums.role import RoleEnum
from submit_api.exceptions import BadRequestError
from submit_api.services.email_queue_service import SubmitEmailQueueService
from submit_api.utils.constants import (
    NEW_USER_INVITATION_ACCOUNT_ADMIN_EMAIL_TEMPLATE,
    NEW_USER_INVITATION_COLLABORATOR_EMAIL_TEMPLATE,
    NEW_USER_INVITATION_PROJECT_ADMIN_EMAIL_TEMPLATE,
)


@pytest.mark.parametrize(
    ("role_name", "expected_template"),
    [
        (RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, NEW_USER_INVITATION_ACCOUNT_ADMIN_EMAIL_TEMPLATE),
        (RoleEnum.PROJECT_ADMIN.value, NEW_USER_INVITATION_PROJECT_ADMIN_EMAIL_TEMPLATE),
        (RoleEnum.SUBMISSION_ADMIN.value, NEW_USER_INVITATION_COLLABORATOR_EMAIL_TEMPLATE),
        (RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value, NEW_USER_INVITATION_COLLABORATOR_EMAIL_TEMPLATE),
    ],
)
def test_get_invitation_template_for_role(role_name, expected_template):
    """Invitation emails use the template that matches the invited role."""
    invitation = SimpleNamespace(role=SimpleNamespace(role_name=role_name))

    template = SubmitEmailQueueService._get_invitation_template(invitation)

    assert template == expected_template


def test_get_invitation_template_rejects_unknown_role():
    """Unknown invitation roles should not silently use the wrong email copy."""
    invitation = SimpleNamespace(role=SimpleNamespace(role_name="UNKNOWN_ROLE"))

    with pytest.raises(BadRequestError):
        SubmitEmailQueueService._get_invitation_template(invitation)


class TestGetEaoManagerEmails:
    """Tests for _get_eao_manager_emails handling different API response formats."""

    PATCH_TARGET = "submit_api.services.email_queue_service.AuthService.get_group_members"

    @pytest.fixture(autouse=True)
    def _patch_auth(self, monkeypatch):
        """Patch AuthService.get_group_members for isolation."""
        from unittest.mock import Mock
        self.mock_get_members = Mock()
        monkeypatch.setattr(
            "submit_api.services.email_queue_service.AuthService.get_group_members",
            self.mock_get_members,
        )

    def test_returns_emails_when_members_are_strings(self):
        """Auth service returns plain email strings."""
        self.mock_get_members.return_value = [
            "manager1@gov.bc.ca",
            "manager2@gov.bc.ca",
        ]

        result = SubmitEmailQueueService._get_eao_manager_emails()

        assert result == ["manager1@gov.bc.ca", "manager2@gov.bc.ca"]

    def test_returns_emails_when_members_are_dicts(self):
        """Auth service returns dicts with an email key."""
        self.mock_get_members.return_value = [
            {"email": "manager1@gov.bc.ca", "name": "Manager One"},
            {"email": "manager2@gov.bc.ca", "name": "Manager Two"},
        ]

        result = SubmitEmailQueueService._get_eao_manager_emails()

        assert result == ["manager1@gov.bc.ca", "manager2@gov.bc.ca"]

    def test_skips_dicts_without_email(self):
        """Dicts missing an email key are excluded."""
        self.mock_get_members.return_value = [
            {"email": "valid@gov.bc.ca"},
            {"name": "No Email"},
        ]

        result = SubmitEmailQueueService._get_eao_manager_emails()

        assert result == ["valid@gov.bc.ca"]

    def test_skips_empty_strings(self):
        """Empty strings in the members list are excluded."""
        self.mock_get_members.return_value = ["", "manager@gov.bc.ca", ""]

        result = SubmitEmailQueueService._get_eao_manager_emails()

        assert result == ["manager@gov.bc.ca"]

    def test_returns_empty_list_on_value_error(self):
        """A ValueError from the auth service yields an empty list."""
        self.mock_get_members.side_effect = ValueError("bad response")

        result = SubmitEmailQueueService._get_eao_manager_emails()

        assert result == []

    def test_returns_empty_list_on_os_error(self):
        """An OSError from the auth service yields an empty list."""
        self.mock_get_members.side_effect = OSError("connection failed")

        result = SubmitEmailQueueService._get_eao_manager_emails()

        assert result == []

    def test_returns_empty_list_when_no_members(self):
        """An empty response from auth service returns empty list."""
        self.mock_get_members.return_value = []

        result = SubmitEmailQueueService._get_eao_manager_emails()

        assert result == []
