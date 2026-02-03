"""Test Invitation API endpoints.

Tests for invitation resource endpoints.
"""

from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from unittest.mock import patch

from faker import Faker

from submit_api import get_named_config
from submit_api.enums.invitation_status import InvitationStatus
from submit_api.enums.role import RoleEnum
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_auth_header,
    factory_invitation_model,
    factory_project_model,
    factory_user_model,
    setup_authenticated_proponent
)

fake = Faker()
CONFIG = get_named_config("testing")


def test_create_invitation_to_existing_account(client, session, jwt):
    """Test creating invitation for existing account."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    payload = {
        "proponent_id": 1234,
        "account_id": account_project.account_id,
        "account_project_ids": [account_project.id],
        "role_name": RoleEnum.PROJECT_ADMIN.value,
        "email": fake.email(),
    }

    response = client.post("/api/invitations", json=payload, headers=headers)

    assert response.status_code == HTTPStatus.CREATED
    data = response.get_json()
    assert "token" in data
    assert data["account_id"] == account_project.account_id
    assert data["status"] == InvitationStatus.PENDING.value
    assert "invitation_url" in data


def test_create_invitation_conflict(client, session, jwt):
    """Test creating invitation when user already exists."""
    auth_guid = TestJwtClaims.staff_admin_role['preferred_username']
    factory_user_model(auth_guid=auth_guid)

    # Mock the service to return a conflict
    with patch('submit_api.services.invitation_service.InvitationService.invite_user_to_project') as mock_service:
        mock_service.return_value = {
            'success': False,
            'error': 'User already exists'
        }

        payload = {
            "proponent_id": 1234,
            "account_id": 1,
            "account_project_ids": [1],
            "role_name": RoleEnum.PROJECT_ADMIN.value,
            "email": fake.email(),
        }

        headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
        response = client.post("/api/invitations", json=payload, headers=headers)

        assert response.status_code == HTTPStatus.CONFLICT


def test_create_new_account_invitation(client, session, jwt):
    """Test creating invitation for new account."""
    auth_guid = TestJwtClaims.staff_admin_role['preferred_username']
    factory_user_model(auth_guid=auth_guid)

    project = factory_project_model(name="New Project", proponent_id=5678)
    payload = {
        "proponent_id": 5678,
        "role_name": RoleEnum.PROJECT_ADMIN.value,
        "project_ids": [project.id],
    }

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.post("/api/invitations/account", json=payload, headers=headers)

    assert response.status_code == HTTPStatus.CREATED
    data = response.get_json()
    assert "token" in data
    assert data["project_ids"] == [project.id]
    assert "invitation_url" in data


def test_get_invitation_by_token(client, session, jwt):
    """Test retrieving invitation by token."""
    _, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
    )

    response = client.get(f"/api/invitations/{invitation.token}")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["token"] == invitation.token
    assert data["account_id"] == account_project.account_id
    assert data["status"] == InvitationStatus.PENDING.value


def test_get_invitation_not_found(client, session):
    """Test retrieving non-existent invitation."""
    response = client.get("/api/invitations/invalid-token")

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_get_invitation_expired(client, session, jwt):
    """Test retrieving expired invitation."""
    _, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
        expiry_date=datetime.now(timezone.utc) - timedelta(days=1),  # Expired
    )

    response = client.get(f"/api/invitations/{invitation.token}")

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_delete_invitation_by_token(client, session, jwt):
    """Test revoking invitation by token."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
        project_ids=[account_project.project_id]
    )

    response = client.delete(f"/api/invitations/{invitation.token}", headers=headers)

    assert response.status_code == HTTPStatus.NO_CONTENT


def test_delete_invitation_not_found(client, session, jwt):
    """Test revoking non-existent invitation."""
    auth_guid = TestJwtClaims.staff_admin_role['preferred_username']
    factory_user_model(auth_guid=auth_guid)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.delete("/api/invitations/invalid-token", headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_accept_invitation(client, session, jwt):
    """Test accepting an invitation."""
    _, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
        project_ids=[account_project.project_id]
    )

    payload = {
        "auth_guid": fake.uuid4(),
        "email": fake.email(),
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "position": fake.job(),
        "work_email_address": fake.email(),
        "work_contact_number": fake.email(),
        "has_agreed_to_terms": True,
        "terms_of_service_version_id": 1
    }

    response = client.post(f"/api/invitations/{invitation.token}", json=payload)

    assert response.status_code == HTTPStatus.CREATED
    data = response.get_json()
    print(data)
    assert "user_id" in data

    # Verify that account_projects were created during acceptance
    from submit_api.models import AccountProject as AccountProjectModel
    account_projects = AccountProjectModel.get_all_in_project_ids(invitation.project_ids)
    assert len(account_projects) > 0
    assert any(ap.account_id == invitation.account_id for ap in account_projects)


def test_accept_invitation_invalid_token(client, session):
    """Test accepting invitation with invalid token."""
    payload = {
        "user_guid": fake.uuid4(),
        "email": fake.email(),
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
    }

    response = client.post("/api/invitations/invalid-token", json=payload)

    assert response.status_code == HTTPStatus.BAD_REQUEST


def test_get_invitation_by_id(client, session, jwt):
    """Test retrieving invitation by ID."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
        project_ids=[account_project.project_id]
    )

    response = client.get(f"/api/invitations/id/{invitation.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["id"] == invitation.id
    assert data["account_id"] == account_project.account_id


def test_get_invitation_by_id_not_found(client, session, jwt):
    """Test retrieving non-existent invitation by ID."""
    auth_guid = TestJwtClaims.staff_admin_role['preferred_username']
    factory_user_model(auth_guid=auth_guid)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.get("/api/invitations/id/99999", headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_delete_invitation_by_id(client, session, jwt):
    """Test revoking invitation by ID."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
        project_ids=[account_project.project_id]
    )

    response = client.delete(f"/api/invitations/id/{invitation.id}", headers=headers)

    assert response.status_code == HTTPStatus.NO_CONTENT


def test_delete_invitation_by_id_not_found(client, session, jwt):
    """Test revoking non-existent invitation by ID."""
    auth_guid = TestJwtClaims.staff_admin_role['preferred_username']
    factory_user_model(auth_guid=auth_guid)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.delete("/api/invitations/id/99999", headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_resend_invitation(client, session, jwt):
    """Test resending an invitation."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
        project_ids=[account_project.project_id]
    )

    response = client.post(f"/api/invitations/id/{invitation.id}/resend", headers=headers)

    assert response.status_code == HTTPStatus.NO_CONTENT


def test_resend_invitation_not_found(client, session, jwt):
    """Test resending non-existent invitation."""
    auth_guid = TestJwtClaims.staff_admin_role['preferred_username']
    factory_user_model(auth_guid=auth_guid)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.post("/api/invitations/id/99999/resend", headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_resend_used_invitation(client, session, jwt):
    """Test resending already used invitation."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    invitation = factory_invitation_model(
        account_id=account_project.account_id,
        status=InvitationStatus.USED.value,
        project_ids=[account_project.project_id]
    )

    response = client.post(f"/api/invitations/id/{invitation.id}/resend", headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_create_invitation_unauthorized(client, session):
    """Test creating invitation without authentication."""
    payload = {
        "proponent_id": 1234,
        "account_id": 1,
        "account_project_ids": [1],
        "role_name": RoleEnum.PROJECT_ADMIN.value,
        "email": fake.email(),
    }

    response = client.post("/api/invitations", json=payload)

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_delete_invitation_unauthorized(client, session):
    """Test deleting invitation without authentication."""
    response = client.delete("/api/invitations/some-token")

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_create_invitation_with_multiple_projects(client, session, jwt):
    """Test creating invitation with multiple account projects."""
    auth_guid = TestJwtClaims.staff_admin_role['preferred_username']
    factory_user_model(auth_guid=auth_guid)

    account = factory_account_model(proponent_id=1234)
    project1 = factory_project_model(name="Project 1", proponent_id=1234)
    project2 = factory_project_model(name="Project 2", proponent_id=1234)
    account_project1 = factory_account_project_model(account_id=account.id, project_id=project1.id)
    account_project2 = factory_account_project_model(account_id=account.id, project_id=project2.id)

    payload = {
        "proponent_id": 1234,
        "account_id": account.id,
        "account_project_ids": [account_project1.id, account_project2.id],
        "role_name": RoleEnum.PROJECT_ADMIN.value,
        "email": fake.email(),
    }

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.post("/api/invitations", json=payload, headers=headers)

    assert response.status_code == HTTPStatus.CREATED
    data = response.get_json()
    assert "token" in data
