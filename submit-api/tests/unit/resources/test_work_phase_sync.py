"""Tests for the work phase-sync endpoint used by the epic-cron job."""
from http import HTTPStatus
from unittest.mock import patch

from submit_api.enums.package_type import PackageApprovalType
from submit_api.models import Package
from submit_api.models.user import UserType
from submit_api.services.work_phase_sync_service import WorkPhaseSyncError
from tests.unit.services.test_work_phase_sync_service import Scenario
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import factory_auth_header, factory_user_model

WORKS_URL = "/api/works"


def _sync_url(work_id):
    return f"{WORKS_URL}/{work_id}/phase-sync"


def _staff_headers(jwt):
    """Create the staff user and return its auth headers."""
    factory_user_model(auth_guid=TestJwtClaims.staff_admin_role["preferred_username"])
    return factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)


def test_phase_sync_archives_and_returns_summary(client, session, jwt):
    """The endpoint archives the work's finished out-of-phase package and reports the counts."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])

    response = client.post(_sync_url(scenario.work.id), headers=_staff_headers(jwt))

    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == {"work_id": scenario.work.id, "archived": 1, "created": 0, "skipped": False}
    assert Package.find_by_id(package.id).archived_on is not None


def test_phase_sync_unauthenticated_returns_401(client):
    """A missing auth header returns 401."""
    assert client.post(_sync_url(1)).status_code == HTTPStatus.UNAUTHORIZED


def test_phase_sync_wrong_role_is_rejected(client, session, jwt):
    """A proponent token, which has no staff role, is rejected."""
    claims = TestJwtClaims.proponent_role.value.copy()
    factory_user_model(auth_guid=claims["preferred_username"], user_type=UserType.PROPONENT)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    assert client.post(_sync_url(1), headers=headers).status_code == HTTPStatus.UNAUTHORIZED


def test_phase_sync_unknown_work_returns_404(client, session, jwt):
    """An unknown work id returns 404."""
    assert client.post(_sync_url(999999), headers=_staff_headers(jwt)).status_code == HTTPStatus.NOT_FOUND


def test_phase_sync_partial_failure_returns_500(client, session, jwt):
    """A failed step returns 500 so the caller calls again to complete it."""
    scenario = Scenario(session)
    headers = _staff_headers(jwt)

    with patch(
        "submit_api.resources.work.WorkPhaseSyncService.reconcile_work",
        side_effect=WorkPhaseSyncError("boom"),
    ):
        response = client.post(_sync_url(scenario.work.id), headers=headers)

    assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
    assert "boom" in response.get_json()["message"]
