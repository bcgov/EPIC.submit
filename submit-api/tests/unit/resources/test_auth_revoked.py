"""Tests for per-request enforcement of revoked proponent access.

These cover the centralized check in `Auth.require`, which must block a revoked
proponent on ANY authenticated endpoint (even plain `@auth.require` ones) and
return a machine-readable `error_code` the frontend keys off.
"""
from http import HTTPStatus

from submit_api.models import AccountUser as AccountUserModel
from submit_api.models import User as UserModel
from submit_api.models.user import UserType
from submit_api.models.user_status import UserStatusEnum
from submit_api.utils.constants import ACCESS_REVOKED_ERROR_CODE

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model, factory_account_project_model, factory_auth_header,
    factory_project_model, factory_user_model, setup_authenticated_proponent)

PROJECTS_URL = "/api/projects"


def test_active_proponent_can_access_require_endpoint(client, session, jwt):
    """An active proponent passes the per-request revoked check."""
    headers, account_project = setup_authenticated_proponent(session, jwt)

    response = client.get(f"{PROJECTS_URL}/{account_project.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK


def test_revoked_proponent_blocked_on_require_endpoint(client, session, jwt):
    """A revoked proponent is blocked with 403 + ACCESS_REVOKED error_code.

    Uses a plain `@auth.require` endpoint to prove the block is centralized and
    not tied to role-permission decorators.
    """
    headers, account_project = setup_authenticated_proponent(session, jwt)

    # Revoke the just-authenticated user (simulates revoke from another browser).
    account_users = AccountUserModel.get_users_by_account_id(account_project.account_id)
    for account_user in account_users:
        user = UserModel.find_by_id(account_user.user_id)
        user.status_id = UserStatusEnum.ACCESS_REVOKED.value
    session.flush()

    response = client.get(f"{PROJECTS_URL}/{account_project.id}", headers=headers)

    assert response.status_code == HTTPStatus.FORBIDDEN
    data = response.get_json()
    assert data is not None
    assert data.get("error_code") == ACCESS_REVOKED_ERROR_CODE


def test_staff_user_not_blocked_by_revoked_status(client, session, jwt):
    """A staff user is never subject to the proponent revoke check.

    Even if a staff User row somehow carries ACCESS_REVOKED status, the
    per-request check must not block them.
    """
    claims = TestJwtClaims.staff_admin_role
    auth_guid = claims["preferred_username"]

    staff_user = factory_user_model(auth_guid=auth_guid, user_type=UserType.STAFF)
    staff_user.status_id = UserStatusEnum.ACCESS_REVOKED.value

    account = factory_account_model()
    project = factory_project_model(name="StaffAccessProject", proponent_id=778899)
    account_project = factory_account_project_model(
        account_id=account.id, project_id=project.id
    )
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=claims)

    response = client.get(f"{PROJECTS_URL}/{account_project.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK
