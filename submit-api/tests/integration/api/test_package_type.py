"""Integration tests for the package type endpoints."""
from http import HTTPStatus

from faker import Faker
import pytest

from submit_api.models.package_type import PackageType
from tests.utilities.factory_utils import (
    factory_project_model, factory_track_phase, factory_track_work)


BASE_URL = "/api/staff/package-types"
fake = Faker()


def _payload(phase, **overrides):
    """Build a package type payload bound to the given phase."""
    payload = {
        "ea_act_name": phase.ea_act_name,
        "work_type_name": phase.work_type_name,
        "phase_name": phase.name,
        "package_type_name": f"PT {fake.uuid4()}",
        "package_type_title": "Integration Package Type",
        "item_types": [{"id": 1}],
    }
    payload.update(overrides)
    return payload


def test_get_package_types_by_phase(session, client, auth_header):
    """Package types attached to a phase are listed."""
    phase = factory_track_phase(session)
    session.add(PackageType(name="Phase PT", title="Phase PT", phase_id=phase.id))
    session.flush()

    response = client.get(f"{BASE_URL}/phase/{phase.id}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert [p["name"] for p in response.get_json()] == ["Phase PT"]


def test_get_package_types_by_phase_unauthorized(client):
    """A missing token is rejected."""
    assert client.get(f"{BASE_URL}/phase/1").status_code == HTTPStatus.UNAUTHORIZED


def test_get_package_types_by_project(session, client, auth_header):
    """Package types for the project's current phases are returned."""
    phase = factory_track_phase(session)
    project = factory_project_model(name="PT Project", proponent_id=fake.random_int(100000, 999999))
    factory_track_work(session, project.id, phase_id=phase.id)
    session.add(PackageType(name="Project PT", title="Project PT", phase_id=phase.id))
    session.flush()

    response = client.get(f"{BASE_URL}/project/{project.id}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert "Project PT" in [p["name"] for p in response.get_json()]


def test_get_package_types_by_project_includes_management_plan_when_approved(session, client, auth_header):
    """Approved-condition projects also receive the phase-less Management Plan type."""
    project = factory_project_model(name="Approved", proponent_id=fake.random_int(100000, 999999))
    project.has_approved_condition = True
    session.add(project)
    session.flush()

    response = client.get(f"{BASE_URL}/project/{project.id}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert "Management Plan" in [p["name"] for p in response.get_json()]


def test_get_package_types_by_project_unauthorized(client):
    """A missing token is rejected."""
    assert client.get(f"{BASE_URL}/project/1").status_code == HTTPStatus.UNAUTHORIZED


def test_create_package_type_with_phase(session, client, auth_header):
    """A new package type is created for an existing phase."""
    phase = factory_track_phase(session, display_name="Display Phase")
    payload = _payload(phase, mandatory=True, approval_type="A", success_message="Done")

    response = client.post(BASE_URL, json=payload, headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["created"] is True
    assert data["phase_id"] == phase.id
    assert data["approval_type"] == "A"
    assert data["item_type_ids"] == [1]
    assert data["phase_name"] == "Display Phase"


def test_create_package_type_without_phase_and_new_item_type(session, client, auth_header):
    """Phase-less package types can create new item types on the fly."""
    item_name = f"New Item {fake.uuid4()}"
    payload = {
        "package_type_name": f"NoPhase {fake.uuid4()}",
        "package_type_title": "No phase",
        "item_types": [{"name": item_name, "submission_method": "DOCUMENT_UPLOAD", "is_required": False}],
    }

    response = client.post(BASE_URL, json=payload, headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["phase_id"] is None
    assert data["phase_name"] is None
    assert [i["name"] for i in data["created_item_types"]] == [item_name]


def test_create_package_type_reuses_existing_item_type_by_name(session, client, auth_header):
    """An item type name that already exists is not created twice."""
    item_name = f"Reuse Item {fake.uuid4()}"
    item_types = [{"name": item_name, "submission_method": "FORM_SUBMISSION"}]
    first = client.post(BASE_URL, json={
        "package_type_name": f"A {fake.uuid4()}", "package_type_title": "A", "item_types": item_types
    }, headers=auth_header)
    second = client.post(BASE_URL, json={
        "package_type_name": f"B {fake.uuid4()}", "package_type_title": "B", "item_types": item_types
    }, headers=auth_header)

    assert len(first.get_json()["created_item_types"]) == 1
    assert second.get_json()["created_item_types"] == []


def test_update_existing_package_type(session, client, auth_header):
    """Posting the same name and phase updates the package type."""
    phase = factory_track_phase(session)
    payload = _payload(phase, approval_type="B")
    created = client.post(BASE_URL, json=payload, headers=auth_header).get_json()

    payload["package_type_title"] = "Updated title"
    payload["approval_type"] = None
    response = client.post(BASE_URL, json=payload, headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["created"] is False
    assert data["id"] == created["id"]
    assert data["title"] == "Updated title"
    assert data["approval_type"] is None


def test_create_package_type_unknown_phase_fails(session, client, auth_header):
    """An unknown phase is reported as an error."""
    payload = {
        "ea_act_name": "Nope", "work_type_name": "Nope", "phase_name": "Nope",
        "package_type_name": "X", "package_type_title": "X", "item_types": [{"id": 1}],
    }
    with pytest.raises(ValueError):
        client.post(BASE_URL, json=payload, headers=auth_header)


def test_create_package_type_unknown_item_type_id_fails(session, client, auth_header):
    """An unknown item type id is reported as an error."""
    payload = {"package_type_name": "X", "package_type_title": "X", "item_types": [{"id": 99999999}]}
    with pytest.raises(ValueError):
        client.post(BASE_URL, json=payload, headers=auth_header)


def test_create_package_type_requires_staff_role(client, jwt):
    """Proponents cannot create package types."""
    from tests.utilities.factory_scenarios import TestJwtClaims
    from tests.utilities.factory_utils import factory_auth_header

    headers = factory_auth_header(jwt, TestJwtClaims.proponent_role)
    response = client.post(BASE_URL, json={}, headers=headers)
    assert response.status_code in (HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN)
