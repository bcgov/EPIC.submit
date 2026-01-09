"""Test Proponent.

Tests for proponents.
"""

from http import HTTPStatus

from submit_api.enums.proponent_status import ProponentStatus
from tests.utilities.factory_utils import (
    factory_account_model, factory_invitation_model, factory_project_with_proponent,
    factory_proponent_model)


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


def test_get_all_proponents_from_table(client, session):
    """Test get all proponents from the new Proponent table."""
    proponent1 = factory_proponent_model(
        proponent_id=1001,
        name="Alpha Proponent",
        status=ProponentStatus.ELIGIBLE,
        is_deleted=False
    )
    proponent2 = factory_proponent_model(
        proponent_id=1002,
        name="Beta Proponent",
        status=ProponentStatus.ONBOARDED,
        is_deleted=False
    )
    # Create a deleted proponent that should not be returned
    factory_proponent_model(
        proponent_id=1003,
        status=ProponentStatus.INELIGIBLE,
        is_deleted=True
    )

    response = client.get("/api/staff/proponents/all")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 2

    # Check that both proponents are in the response
    proponent_ids = [p["proponent_id"] for p in data]
    assert proponent1.proponent_id in proponent_ids
    assert proponent2.proponent_id in proponent_ids

    # Check that deleted proponent is not in the response
    assert 1003 not in proponent_ids

    # Check that status is properly serialized
    alpha_proponent = next(p for p in data if p["proponent_id"] == proponent1.proponent_id)
    assert alpha_proponent["status"] == "ELIGIBLE"
    assert alpha_proponent["name"] == "Alpha Proponent"
    assert alpha_proponent["is_deleted"] is False

    beta_proponent = next(p for p in data if p["proponent_id"] == proponent2.proponent_id)
    assert beta_proponent["status"] == "ONBOARDED"
    assert beta_proponent["name"] == "Beta Proponent"


def test_get_all_proponents_with_null_status(client, session):
    """Test get all proponents with null status."""
    proponent = factory_proponent_model(
        proponent_id=2001,
        name="Null Status Proponent",
        status=None,
        is_deleted=False
    )

    response = client.get("/api/staff/proponents/all")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)

    proponent_data = next(p for p in data if p["proponent_id"] == proponent.proponent_id)
    assert proponent_data["status"] is None
    assert proponent_data["name"] == "Null Status Proponent"


def test_get_all_proponents_empty(client, session):
    """Test get all proponents when no proponents exist."""
    response = client.get("/api/staff/proponents/all")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 0
