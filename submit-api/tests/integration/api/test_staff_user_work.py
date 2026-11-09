"""Integration tests for staff user work assignments (real DB, mocked epic.auth)."""
from http import HTTPStatus
from unittest.mock import patch

from faker import Faker

from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import StaffUser, StaffUserWork
from submit_api.services.auth_service import AuthService
from submit_api.services.staff_user_work_service import StaffUserWorkService
from tests.utilities.factory_utils import (
    factory_project_model, factory_track_phase, factory_track_work, factory_user_model)


fake = Faker()
URL = "/api/staff-user-works"
LEAD_GROUP = "SUBMIT/OPS_TEAM_LEAD"


def _work(session):
    """Create a track work."""
    phase = factory_track_phase(session)
    project = factory_project_model(name="Work Project", proponent_id=fake.random_int(100000, 999999))
    return factory_track_work(session, project.id, phase_id=phase.id)


def _staff_user(session, email=None):
    """Create a persisted staff user."""
    user = factory_user_model(auth_guid=f"{fake.user_name()}@idir", session=session)
    staff_user = StaffUser.create_staff_user({
        "first_name": "Sam", "last_name": "Staff", "work_email_address": email or fake.email(), "user_id": user.id,
    })
    session.flush()
    return staff_user


def test_get_all_staff_work_roles(session, client, auth_header):
    """Active assignments are listed with staff details."""
    work = _work(session)
    staff_user = _staff_user(session)
    StaffUserWork.get_or_create(staff_user.id, work.id)

    response = client.get(URL, headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    row = next(r for r in response.get_json() if r["work_id"] == work.id)
    assert row["email"] == staff_user.work_email_address
    assert row["full_name"] == "Sam Staff"


def test_get_all_staff_work_roles_error(session, client, auth_header):
    """Unexpected failures surface as 500."""
    with patch.object(StaffUserWorkService, "get_all_staff_work_roles", side_effect=RuntimeError("db")):
        assert client.get(URL, headers=auth_header).status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_create_assignment_for_existing_user_assigns_group(session, client, auth_header):
    """The role group is added when the user does not yet have it."""
    work = _work(session)
    staff_user = _staff_user(session)
    payload = {"email": staff_user.work_email_address, "work_id": work.id, "role": "TEAM_LEAD"}

    with patch.object(AuthService, "get_user_groups", return_value=[]), \
            patch.object(AuthService, "update_user_group") as update_group:
        response = client.post(URL, json=payload, headers=auth_header)

    assert response.status_code == HTTPStatus.CREATED
    assert response.get_json()["work_id"] == work.id
    update_group.assert_called_once_with(staff_user.user.auth_guid, "SUBMIT", "OPS_TEAM_LEAD")


def test_create_assignment_user_already_in_group(session, client, auth_header):
    """No group change is made when the user already has the role group."""
    work = _work(session)
    staff_user = _staff_user(session)
    payload = {"email": staff_user.work_email_address, "work_id": work.id, "role": "TEAM_LEAD"}

    with patch.object(AuthService, "get_user_groups", return_value=[{"path": LEAD_GROUP}]), \
            patch.object(AuthService, "update_user_group") as update_group:
        response = client.post(URL, json=payload, headers=auth_header)

    assert response.status_code == HTTPStatus.CREATED
    update_group.assert_not_called()


def test_create_assignment_creates_missing_staff_user(session):
    """A staff user is created from the epic.auth lookup when none exists."""
    work = _work(session)
    email = fake.email()
    auth_user = {"username": f"{fake.user_name()}@idir", "first_name": "New", "last_name": "Person", "email": email}

    with patch.object(AuthService, "get_user_by_email", return_value=auth_user), \
            patch.object(AuthService, "get_user_groups", return_value=[]), \
            patch.object(AuthService, "update_user_group"):
        assignment = StaffUserWorkService.create_or_update_staff_user_work(email, work.id, "TEAM_MEMBER")

    assert assignment.is_active is True
    assert StaffUser.get_by_email(email) is not None


def test_create_assignment_reactivates_inactive(session):
    """An inactive assignment is reactivated."""
    work = _work(session)
    staff_user = _staff_user(session)
    assignment = StaffUserWork.get_or_create(staff_user.id, work.id)
    assignment.is_active = False
    session.flush()

    with patch.object(AuthService, "get_user_groups", return_value=[{"path": LEAD_GROUP}]):
        result = StaffUserWorkService.create_or_update_staff_user_work(
            staff_user.work_email_address, work.id, "TEAM_LEAD")

    assert result.id == assignment.id
    assert result.is_active is True


def test_create_assignment_error_paths(session):
    """Invalid input, missing users, missing works and auth failures raise typed errors."""
    work = _work(session)
    staff_user = _staff_user(session)
    email = staff_user.work_email_address

    # username missing from epic.auth -> ValueError -> BadRequest
    with patch.object(AuthService, "get_user_by_email", return_value={"username": None}):
        try:
            StaffUserWorkService.create_or_update_staff_user_work(fake.email(), work.id, "TEAM_LEAD")
            assert False, "expected BadRequestError"
        except BadRequestError:
            pass

    # epic.auth failure -> ResourceNotFound
    with patch.object(AuthService, "get_user_by_email", side_effect=RuntimeError("down")):
        try:
            StaffUserWorkService.create_or_update_staff_user_work(fake.email(), work.id, "TEAM_LEAD")
            assert False, "expected ResourceNotFoundError"
        except ResourceNotFoundError:
            pass

    # unknown email in epic.auth -> ResourceNotFound is propagated
    with patch.object(AuthService, "get_user_by_email", side_effect=ResourceNotFoundError("nope")):
        try:
            StaffUserWorkService.create_or_update_staff_user_work(fake.email(), work.id, "TEAM_LEAD")
            assert False, "expected ResourceNotFoundError"
        except ResourceNotFoundError:
            pass

    # invalid role
    try:
        StaffUserWorkService.create_or_update_staff_user_work(email, work.id, "BOSS")
        assert False, "expected BadRequestError"
    except BadRequestError:
        pass

    # group assignment fails
    with patch.object(AuthService, "get_user_groups", side_effect=RuntimeError("down")):
        try:
            StaffUserWorkService.create_or_update_staff_user_work(email, work.id, "TEAM_LEAD")
            assert False, "expected ResourceNotFoundError"
        except ResourceNotFoundError:
            pass

    # group lookup reports user not found
    with patch.object(AuthService, "get_user_groups", side_effect=ResourceNotFoundError("gone")):
        try:
            StaffUserWorkService.create_or_update_staff_user_work(email, work.id, "TEAM_LEAD")
            assert False, "expected ResourceNotFoundError"
        except ResourceNotFoundError:
            pass

    # unknown work
    with patch.object(AuthService, "get_user_groups", return_value=[{"path": LEAD_GROUP}]):
        try:
            StaffUserWorkService.create_or_update_staff_user_work(email, 99999999, "TEAM_LEAD")
            assert False, "expected ResourceNotFoundError"
        except ResourceNotFoundError:
            pass


def test_create_assignment_endpoint_error_returns_500(session, client, auth_header):
    """Service errors surface as 500 from the endpoint."""
    payload = {"email": fake.email(), "work_id": 1, "role": "TEAM_LEAD"}
    with patch.object(StaffUserWorkService, "create_or_update_staff_user_work", side_effect=RuntimeError("x")):
        assert client.post(URL, json=payload, headers=auth_header).status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_create_assignment_rejects_invalid_role(session, client, auth_header):
    """The request schema rejects unknown roles."""
    import pytest
    from marshmallow import ValidationError

    payload = {"email": fake.email(), "work_id": 1, "role": "BOSS"}
    with pytest.raises(ValidationError):
        client.post(URL, json=payload, headers=auth_header)


def test_remove_assignment_by_work_strips_groups_when_last(session, client, auth_header):
    """Removing the last assignment also removes the OPS groups."""
    work = _work(session)
    staff_user = _staff_user(session)
    StaffUserWork.get_or_create(staff_user.id, work.id)

    with patch.object(AuthService, "get_user_groups", return_value=[{"path": LEAD_GROUP}]), \
            patch.object(AuthService, "delete_user_group") as delete_group:
        response = client.delete(f"{URL}/work/{work.id}?email={staff_user.work_email_address}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    delete_group.assert_called_once_with(staff_user.user.auth_guid, "OPS_TEAM_LEAD")
    assert StaffUserWork.find_by_staff_user_and_work(staff_user.id, work.id).is_active is False


def test_remove_assignment_by_work_keeps_groups_when_others_remain(session, client, auth_header):
    """Groups are kept while the user still has other active works."""
    work_a, work_b = _work(session), _work(session)
    staff_user = _staff_user(session)
    StaffUserWork.get_or_create(staff_user.id, work_a.id)
    StaffUserWork.get_or_create(staff_user.id, work_b.id)

    with patch.object(AuthService, "delete_user_group") as delete_group:
        response = client.delete(f"{URL}/work/{work_a.id}?email={staff_user.work_email_address}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    delete_group.assert_not_called()


def test_remove_assignment_by_work_requires_email(session, client, auth_header):
    """The email query parameter is required."""
    assert client.delete(f"{URL}/work/1", headers=auth_header).status_code == HTTPStatus.BAD_REQUEST


def test_remove_assignment_by_work_not_found(session, client, auth_header):
    """Unknown users or inactive assignments surface as errors."""
    staff_user = _staff_user(session)
    unknown_user = client.delete(f"{URL}/work/1?email=nobody@example.com", headers=auth_header)
    no_assignment = client.delete(f"{URL}/work/99999999?email={staff_user.work_email_address}", headers=auth_header)
    assert unknown_user.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
    assert no_assignment.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_remove_all_assignments_by_user(session, client, auth_header):
    """All of a user's assignments are deactivated and groups removed."""
    work_a, work_b = _work(session), _work(session)
    staff_user = _staff_user(session)
    StaffUserWork.get_or_create(staff_user.id, work_a.id)
    StaffUserWork.get_or_create(staff_user.id, work_b.id)
    groups = [{"path": LEAD_GROUP}, {"path": "SUBMIT/OPS_TEAM_MEMBER"}]

    with patch.object(AuthService, "get_user_groups", return_value=groups), \
            patch.object(AuthService, "delete_user_group") as delete_group:
        response = client.delete(f"{URL}/user/{staff_user.user.auth_guid}", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    assert delete_group.call_count == 2
    assert StaffUserWork.find_by_staff_user_id(staff_user.id) == []


def test_remove_all_assignments_unknown_user(session, client, auth_header):
    """An unknown auth_guid is reported as an error."""
    assert client.delete(f"{URL}/user/ghost@idir", headers=auth_header).status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_remove_ops_groups_swallows_auth_errors(session):
    """Failures to reach epic.auth do not abort removal."""
    with patch.object(AuthService, "get_user_groups", side_effect=RuntimeError("down")):
        StaffUserWorkService._remove_ops_groups("someone@idir")


def test_remove_ops_groups_top_level_group(session):
    """Groups without a sub group are removed by their parent name."""
    with patch("submit_api.services.staff_user_work_service.STAFF_WORK_ROLE_KEYCLOAK_GROUPS", {"X": "TOP"}), \
            patch.object(AuthService, "get_user_groups", return_value=[{"path": "TOP"}]), \
            patch.object(AuthService, "delete_user_group") as delete_group:
        StaffUserWorkService._remove_ops_groups("someone@idir")
    delete_group.assert_called_once_with("someone@idir", "TOP")


def test_get_works_for_staff_user(session):
    """Active works for a staff user are returned."""
    work = _work(session)
    staff_user = _staff_user(session)
    StaffUserWork.get_or_create(staff_user.id, work.id)
    assert [w.work_id for w in StaffUserWorkService.get_works_for_staff_user(staff_user.id)] == [work.id]


def test_create_and_assign_group(session):
    """A staff user is created and added to the named group."""
    from submit_api.services.staff_user_service import StaffUserService

    auth_user = {"username": f"{fake.user_name()}@idir", "email_address": fake.email()}
    with patch.object(AuthService, "get_user_by_email", return_value=auth_user), \
            patch.object(AuthService, "update_user_group") as update_group:
        staff_user = StaffUserService.create_and_assign_group("x@example.com", "SUBMIT/EAO_MANAGER")

    assert staff_user.id is not None
    update_group.assert_called_once_with(auth_user["username"], "SUBMIT", "EAO_MANAGER")


def test_staff_user_service_create_if_missing(session):
    """create_staff_user_if_missing handles missing, new and existing users."""
    from submit_api.services.staff_user_service import StaffUserService

    try:
        StaffUserService.create_staff_user_if_missing({"auth_guid": "ghost@idir"})
        assert False, "expected ResourceNotFoundError"
    except ResourceNotFoundError:
        pass

    user = factory_user_model(auth_guid=f"{fake.user_name()}@idir", session=session)
    data = {"auth_guid": user.auth_guid, "first_name": "A", "last_name": "B", "work_email_address": fake.email()}
    created = StaffUserService.create_staff_user_if_missing(data)
    assert StaffUserService.create_staff_user_if_missing(data).id == created.id
    assert StaffUserService.get_staff_by_id(user.auth_guid).id == created.id
