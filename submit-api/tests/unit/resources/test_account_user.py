"""Tests for account user resource endpoints (role and status)."""
import copy
from http import HTTPStatus

from faker import Faker

from submit_api.enums.role import RoleEnum
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    create_proponent_with_role,
    factory_account_model,
    factory_account_project_model,
    factory_auth_header,
    factory_project_model,
    setup_authenticated_proponent,
)

fake = Faker()

ACCOUNTS_URL = "/api/accounts"


class TestEditUserRole:
    """Tests for PATCH /accounts/user/{id}/role endpoint."""

    def test_patch_role_returns_200_with_valid_payload(self, client, session, jwt):
        """Admin can update another user's role successfully."""
        headers, account_project = setup_authenticated_proponent(session, jwt)

        # Create a target user (the one whose role will be changed)
        target_auth_guid = fake.uuid4()
        account_id = account_project.account_id
        _, target_account_user, _ = create_proponent_with_role(
            session,
            auth_guid=target_auth_guid,
            account_id=account_id,
            role_name=RoleEnum.SUBMISSION_ADMIN.value,
            account_project_id=account_project.id,
        )
        session.flush()

        payload = {
            "role_name": RoleEnum.PROJECT_ADMIN.value,
            "account_project_ids": [account_project.id],
        }

        response = client.patch(
            f"{ACCOUNTS_URL}/user/{target_account_user.id}/role",
            json=payload,
            headers=headers,
        )

        assert response.status_code == HTTPStatus.OK

    def test_patch_role_returns_403_when_user_edits_self(self, client, session, jwt):
        """User cannot update their own role."""
        account = factory_account_model()
        project = factory_project_model()
        account_project = factory_account_project_model(account.id, project.id)

        auth_guid = fake.uuid4()
        _, account_user, _ = create_proponent_with_role(
            session,
            auth_guid=auth_guid,
            account_id=account.id,
            role_name=RoleEnum.PROJECT_ADMIN.value,
            account_project_id=account_project.id,
        )
        session.flush()

        claims = copy.deepcopy(TestJwtClaims.proponent_role.value)
        claims["preferred_username"] = auth_guid
        headers = factory_auth_header(jwt, claims)

        payload = {
            "role_name": RoleEnum.SUBMISSION_ADMIN.value,
            "account_project_ids": [account_project.id],
        }

        response = client.patch(
            f"{ACCOUNTS_URL}/user/{account_user.id}/role",
            json=payload,
            headers=headers,
        )

        assert response.status_code == HTTPStatus.FORBIDDEN


class TestEditUserStatus:
    """Tests for PATCH /accounts/user/{id}/status endpoint."""

    def test_patch_status_returns_200(self, client, session, jwt):
        """Admin can deactivate another user."""
        headers, account_project = setup_authenticated_proponent(session, jwt)

        # Create a target user to deactivate
        target_auth_guid = fake.uuid4()
        account_id = account_project.account_id
        _, target_account_user, _ = create_proponent_with_role(
            session,
            auth_guid=target_auth_guid,
            account_id=account_id,
            role_name=RoleEnum.SUBMISSION_ADMIN.value,
            account_project_id=account_project.id,
        )
        session.flush()

        payload = {"active": False}

        response = client.patch(
            f"{ACCOUNTS_URL}/user/{target_account_user.id}/status",
            json=payload,
            headers=headers,
        )

        assert response.status_code == HTTPStatus.OK
