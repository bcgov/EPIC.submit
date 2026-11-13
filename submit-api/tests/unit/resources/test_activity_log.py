"""Resource-level tests for the activity log endpoint."""
from copy import deepcopy
from http import HTTPStatus

import pytest

from submit_api.enums.role import RoleEnum
from submit_api.models import ActivityLog
from submit_api.models.user import User, UserType
from submit_api.models.user_status import UserStatusEnum
from submit_api.utils.roles import EpicSubmitRole
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_project_model, factory_auth_header, factory_package_model, factory_project_model,
    factory_user_model, setup_authenticated_proponent)

ACTIVITY_LOGS_URL = "/api/activity-logs"


def _add_log(session, package_id, action="Submitted to EAO"):
    """Persist an activity log entry for a package."""
    session.add(
        ActivityLog(
            entity_type="PACKAGE",
            entity_id=package_id,
            action=action,
            actor_id="user-1",
            actor_type="ENTITY",
            visibility="STAFF",
        )
    )
    session.flush()


def test_get_activity_logs_requires_authentication(client, session):
    """Unauthenticated callers are rejected."""
    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/1")

    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.parametrize("role", [
    RoleEnum.ACCOUNT_PRIMARY_ADMIN.value, RoleEnum.PROJECT_ADMIN.value, RoleEnum.SUBMISSION_ADMIN.value,
])
def test_get_activity_logs_success_for_project_member(client, session, jwt, role):
    """Authorized proponents retain shared history and proponent-facing wording."""
    headers, account_project = setup_authenticated_proponent(session, jwt, role=role)
    package = factory_package_model(account_project=account_project)
    _add_log(session, package.id)
    _add_log(session, package.id, action="MP Review Failed")

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK
    assert [log["action"] for log in response.json] == ["Submitted to EAO", "Revision Required"]


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


def test_get_activity_logs_unsupported_entity_type(client, session, jwt):
    """Entity types that cannot be authorized are rejected with 400."""
    headers, _ = setup_authenticated_proponent(session, jwt)

    response = client.get(f"{ACTIVITY_LOGS_URL}/USER/1", headers=headers)

    assert response.status_code == HTTPStatus.BAD_REQUEST


@pytest.mark.parametrize("staff_roles, expected_action", [
    ([EpicSubmitRole.MP_VIEW.value], "Revision Required"),
    ([EpicSubmitRole.FULL_ACCESS.value], "Revision Required"),
    ([EpicSubmitRole.MP_VIEW.value, EpicSubmitRole.EAO_VIEW.value], "MP Review Failed"),
])
def test_get_activity_logs_preserves_staff_response(client, session, jwt, staff_roles, expected_action):
    """Authorized staff retain the release baseline action mapping."""
    user = factory_user_model(user_type=UserType.STAFF, session=session)
    claims = deepcopy(TestJwtClaims.staff_admin_role.value)
    claims["preferred_username"] = user.auth_guid
    claims["realm_access"]["roles"] = staff_roles
    claims["resource_access"] = {}
    headers = factory_auth_header(jwt, claims)
    package = factory_package_model()
    _add_log(session, package.id)
    _add_log(session, package.id, action="MP Review Failed")

    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK
    assert [log["action"] for log in response.json] == ["Submitted to EAO", expected_action]


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
    """Revoked proponents cannot retrieve history for their project."""
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


@pytest.mark.parametrize("assignment", [True, False, None])
def test_work_history_requires_active_assignment(client, session, jwt, assignment):
    """Work staff retain history only for actively assigned works."""
    from submit_api.models import AccountProject, AccountProjectWork, StaffUser, StaffUserWork
    from tests.utilities.factory_utils import factory_track_work

    package = factory_package_model()
    account_project = AccountProject.find_by_id(package.account_project_id)
    work = factory_track_work(session, project_id=account_project.project_id)
    link = AccountProjectWork(account_project_id=account_project.id, work_id=work.id)
    session.add(link)
    session.flush()
    package.account_project_work_id = link.id
    user = factory_user_model(user_type=UserType.STAFF, session=session)
    staff = StaffUser(user_id=user.id, first_name="Test", last_name="Staff", work_email_address="staff@example.com")
    session.add(staff)
    session.flush()
    if assignment is not None:
        session.add(StaffUserWork(staff_user_id=staff.id, work_id=work.id, is_active=assignment))
    session.flush()
    _add_log(session, package.id)
    claims = deepcopy(TestJwtClaims.staff_admin_role.value)
    claims["preferred_username"] = user.auth_guid
    claims["realm_access"]["roles"] = [EpicSubmitRole.W_VIEW.value]
    claims["resource_access"] = {}

    response = client.get(
        f"{ACTIVITY_LOGS_URL}/PACKAGE/{package.id}", headers=factory_auth_header(jwt, claims)
    )

    assert response.status_code == (HTTPStatus.OK if assignment else HTTPStatus.FORBIDDEN)
    if assignment:
        assert [log["action"] for log in response.json] == ["Submitted to EAO"]


def test_invalid_token_is_rejected(client, session):
    """A malformed bearer token never authorizes history access."""
    response = client.get(f"{ACTIVITY_LOGS_URL}/PACKAGE/1", headers={"Authorization": "Bearer invalid"})
    assert response.status_code == HTTPStatus.UNAUTHORIZED
