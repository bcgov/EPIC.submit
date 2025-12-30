"""Test Proponent.

Tests for proponents.
"""

from http import HTTPStatus

from tests.utilities.factory_utils import (
    factory_account_model, factory_invitation_model, factory_project_with_proponent)


def test_get_all_proponents(client, session):
    """Test all get proponents."""
    factory_project_with_proponent(proponent_id=1234, proponent_name="TestProponent")

    response = client.get("/api/staff/proponents")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)
    assert any(p["id"] == 1234 and p["name"] == "TestProponent" for p in data)


def test_get_proponent_by_id(client, session):
    """Test for proponents."""
    project = factory_project_with_proponent(proponent_id=5678, proponent_name="SingleProponent")

    response = client.get(f"/api/staff/proponents/{project.proponent_id}")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == project.proponent_id
    assert data["name"] == "SingleProponent"
    assert "projects" not in data
    assert "invitations" not in data


def test_get_proponent_with_projects(client, session):
    """Test for proponents."""
    project = factory_project_with_proponent(proponent_id=9999, proponent_name="ProjProponent")

    response = client.get(f"/api/staff/proponents/{project.proponent_id}?include-projects=true")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == project.proponent_id
    assert data["name"] == "ProjProponent"
    assert "projects" in data
    assert isinstance(data["projects"], list)
    assert any(p["id"] == project.id for p in data["projects"])


def test_get_proponent_with_invitations(client, session):
    """Test for proponents."""
    project = factory_project_with_proponent(proponent_id=3333, proponent_name="InviteProponent")
    account = factory_account_model(proponent_id=project.proponent_id)
    factory_invitation_model(account_id=account.id, status="PENDING")

    response = client.get(f"/api/staff/proponents/{project.proponent_id}?include-invitations=true")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == project.proponent_id
    assert "invitations" in data
    assert isinstance(data["invitations"], list)
    assert len(data["invitations"]) >= 1


def test_get_proponent_full_data(client, session):
    """Test for proponents."""
    project = factory_project_with_proponent(proponent_id=4444, proponent_name="FullProponent")
    account = factory_account_model(proponent_id=project.proponent_id)
    factory_invitation_model(account_id=account.id, status="USED")

    response = client.get(
        f"/api/staff/proponents/{project.proponent_id}?include-invitations=true&include-projects=true")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == project.proponent_id
    assert data["name"] == "FullProponent"
    assert "projects" in data
    assert "invitations" in data
