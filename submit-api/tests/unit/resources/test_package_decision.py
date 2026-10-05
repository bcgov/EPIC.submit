"""Resource-level tests for recording a package decision via the state endpoint.

Covers the Approve path carrying a Decision Date through the /state endpoint,
the schema deserialization of decision_date, and the unauthenticated case.
"""
from http import HTTPStatus
from unittest.mock import patch

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_auth_header,
    factory_package_model,
    factory_user_model,
)

STATE_URL = "/api/packages/{package_id}/state"


def test_approve_state_passes_decision_date(client, session, jwt):
    """POST /state with APPROVED forwards the decision_date to the service (200)."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    package = factory_package_model()
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    payload = {"status": "APPROVED", "decision_date": "2026-01-15T00:00:00"}

    with patch(
        "submit_api.resources.package.PackageAccessControl.check_package_access"
    ), patch(
        "submit_api.resources.package.PackageService.update_package_state",
        return_value=package,
    ) as mock_update:
        response = client.post(
            STATE_URL.format(package_id=package.id),
            json=payload,
            headers=headers,
        )

    assert response.status_code == HTTPStatus.OK
    assert mock_update.called
    _, request_body = mock_update.call_args.args
    assert "decision_date" in request_body
    assert request_body["status"] == "APPROVED"


def test_approve_state_without_decision_date_still_succeeds(client, session, jwt):
    """decision_date is optional on the state endpoint (200)."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    package = factory_package_model()
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    payload = {"status": "APPROVED"}

    with patch(
        "submit_api.resources.package.PackageAccessControl.check_package_access"
    ), patch(
        "submit_api.resources.package.PackageService.update_package_state",
        return_value=package,
    ) as mock_update:
        response = client.post(
            STATE_URL.format(package_id=package.id),
            json=payload,
            headers=headers,
        )

    assert response.status_code == HTTPStatus.OK
    assert mock_update.called


def test_state_requires_authentication(client, session, jwt):
    """POST /state without a token is unauthorized (401)."""
    response = client.post(
        STATE_URL.format(package_id=1),
        json={"status": "APPROVED"},
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED
