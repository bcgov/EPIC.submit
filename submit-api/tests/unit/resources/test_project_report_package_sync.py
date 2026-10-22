"""Tests for the project report-package sync endpoint."""
from http import HTTPStatus
from unittest.mock import patch

from faker import Faker

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_auth_header,
    factory_project_with_proponent,
    factory_user_model,
)

fake = Faker()

PROJECTS_URL = "/api/projects"


def _sync_url(project_id):
    return f"{PROJECTS_URL}/{project_id}/report-packages/sync"


def _reports_payload():
    return [{
        "id": 101,
        "condition_number": 21,
        "report_type": "Monitoring/Technical Report",
        "submissions": [{
            "id": 141,
            "condition_subsection": None,
            "frequency": "One Time",
            "management_plan": None,
            "phase": "Construction",
            "report_submission_type": None,
            "report_title": "General Wildlife Habitat Features Report",
            "timing": "Within 30 days",
        }],
    }]


def test_sync_success_returns_counts(client, session, jwt):
    """A staff/service token triggers the sync and returns the counts summary."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)

    project = factory_project_with_proponent(epic_guid=fake.uuid4())
    account = factory_account_model(proponent_id=project.proponent_id)
    factory_account_project_model(account.id, project.id)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=_reports_payload(),
    ):
        response = client.post(_sync_url(project.id), headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["added"] == 1
    assert data["created_packages"] == 1


def test_sync_unauthenticated_returns_401(client):
    """Missing auth header returns 401."""
    response = client.post(_sync_url(1))
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_sync_wrong_role_is_rejected(client, session, jwt):
    """A proponent (no staff role) is rejected.

    The staff-role guard (flask-jwt-oidc) rejects a token lacking the required
    realm role with 401, matching the behaviour of other staff-guarded endpoints.
    """
    claims = TestJwtClaims.proponent_role.value.copy()
    auth_guid = claims["preferred_username"]
    from submit_api.models.user import UserType
    factory_user_model(auth_guid=auth_guid, user_type=UserType.PROPONENT)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    response = client.post(_sync_url(1), headers=headers)
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_sync_unknown_project_returns_404(client, session, jwt):
    """An unknown project id returns 404."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.post(_sync_url(999999), headers=headers)
    assert response.status_code == HTTPStatus.NOT_FOUND
