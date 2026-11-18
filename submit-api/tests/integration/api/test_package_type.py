"""Integration tests for the package type endpoints."""
from http import HTTPStatus

from faker import Faker
from marshmallow import ValidationError
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
    session.add(PackageType(name="Phase PT", title="Phase PT", start_phase_id=phase.id, end_phase_id=phase.id))
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
    session.add(PackageType(name="Project PT", title="Project PT", start_phase_id=phase.id, end_phase_id=phase.id))
    session.flush()

    response = client.get(f"{BASE_URL}/project/{project.id}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert "Project PT" in [p["name"] for p in response.get_json()]


def test_get_package_types_by_project_ignores_phase_without_enable_submit(session, client, auth_header):
    """Package types are not offered for a work whose phase has enable_submit off."""
    phase = factory_track_phase(session, enable_submit=False)
    project = factory_project_model(name="Disabled Phase", proponent_id=fake.random_int(100000, 999999))
    factory_track_work(session, project.id, phase_id=phase.id)
    session.add(PackageType(name="Disabled PT", title="Disabled PT", start_phase_id=phase.id, end_phase_id=phase.id))
    session.flush()

    response = client.get(f"{BASE_URL}/project/{project.id}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert "Disabled PT" not in [p["name"] for p in response.get_json()]


def test_get_package_types_by_phase_empty_when_enable_submit_off(session, client, auth_header):
    """The phase endpoint returns nothing for a phase with enable_submit off."""
    phase = factory_track_phase(session, enable_submit=False)
    session.add(PackageType(name="Off PT", title="Off PT", start_phase_id=phase.id, end_phase_id=phase.id))
    session.flush()

    response = client.get(f"{BASE_URL}/phase/{phase.id}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == []


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
    assert data["start_phase_id"] == phase.id
    assert data["end_phase_id"] == phase.id
    assert data["approval_type"] == "A"
    assert data["item_type_ids"] == [1]
    assert data["phase_name"] == "Display Phase"


def test_create_package_type_with_phase_range_and_label(session, client, auth_header):
    """A package type can span a start and end phase and carry a display label."""
    start = factory_track_phase(session, name="Pre-EA", work_type_id=7)
    end = factory_track_phase(session, name="Early Engagement", work_type_id=7)
    payload = _payload(start, end_phase_name=end.name, phase_label="Pre-EA/Early Engagement")

    response = client.post(BASE_URL, json=payload, headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["start_phase_id"] == start.id
    assert data["end_phase_id"] == end.id
    assert data["phase_label"] == "Pre-EA/Early Engagement"
    assert data["end_phase_name"] == "Early Engagement"

    for phase in (start, end):
        listed = client.get(f"{BASE_URL}/phase/{phase.id}", headers=auth_header).get_json()
        assert data["name"] in [p["name"] for p in listed]


def test_create_package_type_defaults_end_phase_to_start(session, client, auth_header):
    """Omitting end_phase_name makes the package type a single-phase type."""
    phase = factory_track_phase(session)

    data = client.post(BASE_URL, json=_payload(phase), headers=auth_header).get_json()

    assert data["start_phase_id"] == data["end_phase_id"] == phase.id
    assert data["phase_label"] is None


def test_create_package_type_unknown_end_phase_fails(session, client, auth_header):
    """An unknown end phase is reported as an error."""
    phase = factory_track_phase(session)
    with pytest.raises(ValueError):
        client.post(BASE_URL, json=_payload(phase, end_phase_name="Does Not Exist"), headers=auth_header)


def test_create_package_type_label_without_phase_is_rejected(session, client, auth_header):
    """A phase label without phase fields fails schema validation."""
    payload = {
        "package_type_name": "X", "package_type_title": "X", "phase_label": "Label",
        "item_types": [{"id": 1}],
    }
    with pytest.raises(ValidationError):
        client.post(BASE_URL, json=payload, headers=auth_header)


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
    assert data["start_phase_id"] is None
    assert data["end_phase_id"] is None
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
