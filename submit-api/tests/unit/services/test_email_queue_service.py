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
