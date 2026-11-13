"""Resource-level tests for the activity log endpoint."""
from copy import deepcopy
from http import HTTPStatus
from unittest.mock import Mock, patch

from flask_restx import abort
import pytest

from submit_api.enums.role import RoleEnum
from submit_api.models import ActivityLog
from submit_api.models.user import User, UserType
from submit_api.models.user_status import UserStatusEnum
from submit_api.resources.activity_log import ENTITY_ACCESS_CHECKS
from submit_api.utils.roles import EpicSubmitRole
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_project_model, factory_auth_header, factory_package_model, factory_project_model,
    factory_user_model, setup_authenticated_proponent)

ACTIVITY_LOGS_URL = "/api/activity-logs"


def _add_log(session, package_id, action="Submitted to EAO", visibility="PUBLIC"):
    """Persist an activity log entry for a package."""
    session.add(
        ActivityLog(
            entity_type="PACKAGE",
            entity_id=package_id,
            action=action,
            actor_id="user-1",
            actor_type="ENTITY",
            visibility=visibility,
        )
    )
    session.flush()


def test_get_activity_logs_requires_authentication(client, session):
    """Unauthenticated callers are rejected."""
    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/1")

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_get_activity_logs_success_for_project_member(client, session, jwt):
    """A proponent with access to the package's project can read its logs."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)
    _add_log(session, package.id)
    _add_log(session, package.id, action="MP Review Failed")
    _add_log(session, package.id, action="Internal staff event", visibility="STAFF")

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK
    assert [log["action"] for log in response.json] == ["Submitted to EAO", "Revision Required"]
    assert all(log["visibility"] == "PUBLIC" for log in response.json)


def test_get_activity_logs_forbidden_for_other_project(client, session, jwt):
    """A proponent without access to the package's project cannot read its logs."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    # A second project in the same account that the proponent has no role on.
    other_project = factory_project_model(name="Other Project")
    other_account_project = factory_account_project_model(account_project.account_id, other_project.id)
    other_package = factory_package_model(account_project=other_account_project)
    _add_log(session, other_package.id)

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{other_package.id}", headers=headers)

    assert response.status_code == HTTPStatus.FORBIDDEN


def test_get_activity_logs_package_not_found(client, session, jwt):
    """Requesting logs for a package that does not exist returns 404."""
    headers, _ = setup_authenticated_proponent(session, jwt)

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/99999999", headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_get_activity_logs_uses_registered_access_check(client, session, jwt):
    """An entity type is readable only through its own registered access check."""
    headers, _ = setup_authenticated_proponent(session, jwt)
    session.add(
        ActivityLog(
            entity_type="USER", entity_id=7, action="Updated Submission", actor_id="user-1",
            actor_type="ENTITY", visibility="PUBLIC")
    )
    session.flush()
    allow = Mock()

    with patch.dict(ENTITY_ACCESS_CHECKS, {"USER": allow}):
        response = client.get(f"{ACTIVITY_LOGS_URL}/user/7", headers=headers)

    assert response.status_code == HTTPStatus.OK
    allow.assert_called_once_with(7)
    assert [log["action"] for log in response.json] == ["Updated Submission"]


def test_get_activity_logs_denied_by_registered_access_check(client, session, jwt):
    """When a registered access check aborts, no logs are returned."""
    headers, _ = setup_authenticated_proponent(session, jwt)
    deny = Mock(side_effect=lambda _id: abort(HTTPStatus.FORBIDDEN))

    with patch.dict(ENTITY_ACCESS_CHECKS, {"USER": deny}):
        response = client.get(f"{ACTIVITY_LOGS_URL}/USER/7", headers=headers)

    assert response.status_code == HTTPStatus.FORBIDDEN


def test_get_activity_logs_unsupported_entity_type(client, session, jwt):
    """Entity types that cannot be authorized are rejected with 400."""
    headers, _ = setup_authenticated_proponent(session, jwt)

    response = client.get(f"{ACTIVITY_LOGS_URL}/USER/1", headers=headers)

    assert response.status_code == HTTPStatus.BAD_REQUEST


@pytest.mark.parametrize("staff_role", [EpicSubmitRole.MP_VIEW.value, EpicSubmitRole.FULL_ACCESS.value])
def test_get_activity_logs_staff_without_eao_view(client, session, jwt, staff_role):
    """Authorized staff see private entries and staff wording without eao_view."""
    user = factory_user_model(user_type=UserType.STAFF, session=session)
    claims = deepcopy(TestJwtClaims.staff_admin_role.value)
    claims["preferred_username"] = user.auth_guid
    claims["realm_access"]["roles"] = [staff_role]
    claims["resource_access"] = {}
    headers = factory_auth_header(jwt, claims)
    package = factory_package_model()
    _add_log(session, package.id)
    _add_log(session, package.id, action="MP Review Failed", visibility="STAFF")

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK
    assert [log["action"] for log in response.json] == ["Submitted to EAO", "MP Review Failed"]


def test_get_activity_logs_staff_without_package_permission(client, session, jwt):
    """Staff identity alone does not grant access to a package's logs."""
    user = factory_user_model(user_type=UserType.STAFF, session=session)
    claims = deepcopy(TestJwtClaims.staff_admin_role.value)
    claims["preferred_username"] = user.auth_guid
    claims["realm_access"]["roles"] = []
    claims["resource_access"] = {}
    package = factory_package_model()

    response = client.get(
        f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=factory_auth_header(jwt, claims)
    )

    assert response.status_code == HTTPStatus.FORBIDDEN


def test_get_activity_logs_unprovisioned_user(client, session, jwt):
    """A valid token without a local user returns 401 instead of raising an error."""
    claims = deepcopy(TestJwtClaims.proponent_role.value)
    claims["preferred_username"] = "unprovisioned-test-user"
    package = factory_package_model()

    response = client.get(
        f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=factory_auth_header(jwt, claims)
    )

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_get_activity_logs_revoked_proponent(client, session, jwt):
    """Revoked proponents cannot retrieve even public logs for their project."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)
    user = User.query.filter_by(type=UserType.PROPONENT).one()
    user.status_id = UserStatusEnum.ACCESS_REVOKED.value
    session.flush()

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=headers)

    assert response.status_code == HTTPStatus.FORBIDDEN


def test_get_activity_logs_specific_contributor_versions(client, session, jwt):
    """Contributors can read their assigned submission family, but no other package."""
    headers, account_project = setup_authenticated_proponent(
        session, jwt, role=RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value
    )
    original = factory_package_model(account_project=account_project)
    revision = factory_package_model(account_project=account_project, original_package_id=original.id, version=2)
    unrelated = factory_package_model(account_project=account_project)
    user = User.query.filter_by(type=UserType.PROPONENT).one()
    user.account_user.roles[0].original_package_ids = [original.id]
    session.flush()
    _add_log(session, original.id)

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{original.id}", headers=headers)
    assert response.status_code == HTTPStatus.OK
    assert len(response.json) == 1
    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{revision.id}", headers=headers)
    assert response.status_code == HTTPStatus.OK
    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{unrelated.id}", headers=headers)
    assert response.status_code == HTTPStatus.FORBIDDEN
