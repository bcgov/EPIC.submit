"""Archived packages reject changes with a 409 and non-archived packages keep working."""
from datetime import datetime, timezone
from http import HTTPStatus

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_auth_header, factory_item_model, factory_package_model, factory_user_model,
    setup_authenticated_proponent)


def _archive(session, package):
    """Mark the package as archived and persist it."""
    package.archived_on = datetime.now(timezone.utc)
    session.add(package)
    session.commit()


def test_submit_archived_package_returns_conflict(client, session, jwt):
    """Submitting an archived package through the state endpoint returns 409."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)
    _archive(session, package)

    response = client.post(f"/api/packages/{package.id}/state", json={"status": "SUBMITTED"}, headers=headers)

    assert response.status_code == HTTPStatus.CONFLICT


def test_submit_non_archived_package_is_not_blocked_by_the_guard(client, session, jwt):
    """A package that is not archived is validated normally (an empty package is a 400, not a 409)."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)

    response = client.post(f"/api/packages/{package.id}/state", json={"status": "SUBMITTED"}, headers=headers)

    assert response.status_code != HTTPStatus.CONFLICT


def test_create_submission_on_archived_package_returns_conflict(client, session, jwt):
    """Adding a submission to an item of an archived package returns 409."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)
    item = factory_item_model(package=package)
    _archive(session, package)

    response = client.post(
        f"/api/submissions/items/{item.id}",
        json={"type": "FORM", "data": {"submission_json": {}}, "status": "IN_PROGRESS"},
        headers=headers)

    assert response.status_code == HTTPStatus.CONFLICT


def test_create_update_request_on_archived_package_returns_conflict(client, session, jwt):
    """Staff cannot create an update request on an archived package."""
    factory_user_model(auth_guid=TestJwtClaims.staff_admin_role['preferred_username'])
    _, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)
    _archive(session, package)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.post(
        f"/api/packages/{package.id}/update-request",
        json={"submission_item_types": [1], "reason": "More information"},
        headers=headers)

    assert response.status_code == HTTPStatus.CONFLICT


def test_create_package_version_on_archived_package_returns_conflict(client, session, jwt):
    """A new version cannot be created from an archived package."""
    factory_user_model(auth_guid=TestJwtClaims.staff_admin_role['preferred_username'])
    _, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)
    _archive(session, package)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.post(
        f"/api/packages/{package.version.original_package_id}/versions",
        json={"package_id": package.id},
        headers=headers)

    assert response.status_code == HTTPStatus.CONFLICT
