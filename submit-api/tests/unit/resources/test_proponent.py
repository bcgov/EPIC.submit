"""Test Proponent.

Tests for proponents.
"""

from http import HTTPStatus

from submit_api.enums.proponent_status import ProponentStatus
from tests.utilities.factory_utils import (
    factory_account_model, factory_invitation_model, factory_project_with_proponent,
    factory_proponent_model)


def test_get_all_proponents_with_approved_conditions(client, session):
    """Test get proponents with approved conditions filter."""
    factory_project_with_proponent(proponent_id=1234)
    # Create proponent in Proponent table to match the new implementation
    factory_proponent_model(id=1234, name="TestProponent", is_deleted=False)

    response = client.get("/api/proponents?approved-conditions=true")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)
    assert any(p["id"] == 1234 and p["name"] == "TestProponent" for p in data)


def test_get_proponent_by_id(client, session):
    """Test for proponents."""
    factory_proponent_model(id=5678, name="SingleProponent", is_deleted=False)

    response = client.get("/api/proponents/5678")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == 5678
    assert data["name"] == "SingleProponent"
    assert "projects" not in data
    assert "invitations" not in data


def test_get_proponent_with_projects(client, session):
    """Test for proponents."""
    factory_proponent_model(id=9999, name="ProjProponent", is_deleted=False)
    project = factory_project_with_proponent(proponent_id=9999)

    response = client.get("/api/proponents/9999?include-projects=true")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == 9999
    assert data["name"] == "ProjProponent"
    assert "projects" in data
    assert isinstance(data["projects"], list)
    assert any(p["id"] == project.id for p in data["projects"])


def test_get_proponent_with_invitations(client, session):
    """Test for proponents."""
    factory_proponent_model(id=3333, name="InviteProponent", is_deleted=False)
    account = factory_account_model(proponent_id=3333)
    factory_invitation_model(account_id=account.id, status="PENDING")

    response = client.get("/api/proponents/3333?include-invitations=true")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == 3333
    assert "invitations" in data
    assert isinstance(data["invitations"], list)
    assert len(data["invitations"]) >= 1


def test_get_proponent_full_data(client, session):
    """Test for proponents."""
    factory_proponent_model(id=4444, name="FullProponent", is_deleted=False)
    account = factory_account_model(proponent_id=4444)
    factory_invitation_model(account_id=account.id, status="USED")

    response = client.get("/api/proponents/4444?include-invitations=true&include-projects=true")
    assert response.status_code == HTTPStatus.OK

    data = response.get_json()
    assert data["id"] == 4444
    assert data["name"] == "FullProponent"
    assert "projects" in data
    assert "invitations" in data


def test_get_all_proponents_from_table(client, session):
    """Test get all proponents from the new Proponent table."""
    proponent1 = factory_proponent_model(
        name="Alpha Proponent",
        status=ProponentStatus.ELIGIBLE,
        is_deleted=False
    )
    proponent2 = factory_proponent_model(
        name="Beta Proponent",
        status=ProponentStatus.ONBOARDED,
        is_deleted=False
    )
    # Create a deleted proponent that should not be returned
    deleted_proponent = factory_proponent_model(
        status=ProponentStatus.INELIGIBLE,
        is_deleted=True
    )

    response = client.get("/api/proponents")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 2

    # Check that both proponents are in the response
    proponent_ids = [p["id"] for p in data]
    assert proponent1.id in proponent_ids
    assert proponent2.id in proponent_ids

    # Check that deleted proponent is not in the response
    assert deleted_proponent.id not in proponent_ids

    # Check that status is properly serialized
    alpha_proponent = next(p for p in data if p["id"] == proponent1.id)
    assert alpha_proponent["status"] == "ELIGIBLE"
    assert alpha_proponent["name"] == "Alpha Proponent"
    assert alpha_proponent["is_deleted"] is False

    beta_proponent = next(p for p in data if p["id"] == proponent2.id)
    assert beta_proponent["status"] == "ONBOARDED"
    assert beta_proponent["name"] == "Beta Proponent"


def test_get_all_proponents_with_null_status(client, session):
    """Test get all proponents with null status."""
    proponent = factory_proponent_model(
        name="Null Status Proponent",
        status=None,
        is_deleted=False
    )

    response = client.get("/api/proponents")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)

    proponent_data = next(p for p in data if p["id"] == proponent.id)
    assert proponent_data["status"] is None
    assert proponent_data["name"] == "Null Status Proponent"


def test_get_all_proponents_empty(client, session):
    """Test get all proponents when no proponents exist."""
    response = client.get("/api/proponents")

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 0
