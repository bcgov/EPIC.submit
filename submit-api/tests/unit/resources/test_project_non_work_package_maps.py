"""Test the project non-work package maps resource."""
from http import HTTPStatus

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_auth_header, factory_project_with_proponent, factory_user_model)


def _url(project_id):
    """Return the endpoint URL for a project."""
    return f"/api/projects/{project_id}/non-work-package-maps"


def _staff_headers(jwt, session):
    """Return auth headers for a staff user."""
    factory_user_model(auth_guid=TestJwtClaims.staff_admin_role["preferred_username"])
    session.flush()
    return factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)


def test_get_non_work_package_maps_for_eligible_project(client, session, jwt):
    """An approved-condition project gets the Management Plan and Report types, in order, with labels."""
    project = factory_project_with_proponent(has_approved_condition=True)

    response = client.get(_url(project.id), headers=_staff_headers(jwt, session))

    assert response.status_code == HTTPStatus.OK
    body = response.get_json()
    assert [item["code"] for item in body] == ["MANAGEMENT_PLAN", "REPORT"]
    assert body[0]["work_label"] == "Management Plan & Related Documents"
    assert body[1]["work_label"] == "Reports & Recurring Submissions"
    assert body[0]["phase_label"] == body[1]["phase_label"] == "Post Decision"


def test_get_non_work_package_maps_empty_for_ineligible_project(client, session, jwt):
    """A project without approved conditions gets an empty list."""
    project = factory_project_with_proponent(has_approved_condition=False)

    response = client.get(_url(project.id), headers=_staff_headers(jwt, session))

    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == []


def test_get_non_work_package_maps_unknown_project(client, session, jwt):
    """An unknown project returns 404."""
    response = client.get(_url(99999999), headers=_staff_headers(jwt, session))

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_get_non_work_package_maps_requires_token(client):
    """A missing token is rejected."""
    assert client.get(_url(1)).status_code == HTTPStatus.UNAUTHORIZED
