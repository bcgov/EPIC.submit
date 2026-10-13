"""Test Staff User Work de-provisioning endpoint (work_id + email)."""

from http import HTTPStatus
from unittest.mock import patch

from faker import Faker

from submit_api.models.staff_user import StaffUser
from submit_api.models.staff_user_work import StaffUserWork
from submit_api.models.user import UserType
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_auth_header,
    factory_project_with_proponent,
    factory_track_work,
    factory_user_model,
)

fake = Faker()


def _setup_staff_user_work(session, email):
    """Create a user, staff user, work, and an active assignment linking them."""
    auth_guid = f"{fake.user_name()}@idir"
    user = factory_user_model(
        auth_guid=auth_guid, user_type=UserType.STAFF, session=session
    )
    staff_user = StaffUser.create_staff_user(
        {
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
            "work_email_address": email,
            "user_id": user.id,
        },
        session=session,
    )
    project = factory_project_with_proponent()
    work = factory_track_work(session=session, project_id=project.id)
    assignment = StaffUserWork.get_or_create(
        staff_user_id=staff_user.id, work_id=work.id, session=session
    )
    session.commit()
    return staff_user, work, assignment


def test_delete_staff_user_work_success(client, session, jwt):
    """Deleting by work_id + email deactivates that member's assignment."""
    email = fake.email()
    _staff_user, work, assignment = _setup_staff_user_work(session, email)

    with patch(
        "submit_api.services.staff_user_work_service.StaffUserWorkService._remove_ops_groups"
    ):
        headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
        response = client.delete(
            f"/api/staff-user-works/work/{work.id}?email={email}", headers=headers
        )

    assert response.status_code == HTTPStatus.OK
    session.refresh(assignment)
    assert assignment.is_active is False


def test_delete_staff_user_work_missing_email_returns_400(client, session, jwt):
    """Omitting the email query parameter returns a 400."""
    email = fake.email()
    _staff_user, work, _assignment = _setup_staff_user_work(session, email)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.delete(
        f"/api/staff-user-works/work/{work.id}", headers=headers
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "email" in response.get_json()["message"].lower()


def test_delete_staff_user_work_unknown_assignment_returns_500(client, session, jwt):
    """An email/work pair with no active assignment surfaces a not-found error."""
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.delete(
        f"/api/staff-user-works/work/999999?email={fake.email()}", headers=headers
    )

    # The resource wraps service errors (incl. ResourceNotFoundError) as 500.
    assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_delete_staff_user_work_unauthorized(client, session):
    """Calling without authentication is rejected."""
    response = client.delete(
        f"/api/staff-user-works/work/1?email={fake.email()}"
    )

    assert response.status_code == HTTPStatus.UNAUTHORIZED
