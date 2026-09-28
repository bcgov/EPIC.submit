"""Tests for the users resource, focused on POST /users/me login stamping."""
from http import HTTPStatus

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_auth_header,
    factory_user_model,
    setup_authenticated_proponent,
)
from submit_api.models import db
from submit_api.models.user import User, UserType
from submit_api.models.user_status import UserStatusEnum

ME_URL = "/api/users/me"


def test_post_me_stamps_last_login_for_proponent(client, session, jwt):
    """POST /users/me returns 200 and stamps last_login_at for a proponent."""
    headers, _ = setup_authenticated_proponent(session, jwt)

    response = client.post(ME_URL, headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["type"] == UserType.PROPONENT.value
    assert data["account_user"]["last_login_at"] is not None


def test_post_me_updates_last_login_on_subsequent_call(client, session, jwt):
    """A second POST /users/me advances last_login_at past the first value."""
    headers, _ = setup_authenticated_proponent(session, jwt)

    first = client.post(ME_URL, headers=headers)
    assert first.status_code == HTTPStatus.OK
    first_stamp = first.get_json()["account_user"]["last_login_at"]

    second = client.post(ME_URL, headers=headers)
    assert second.status_code == HTTPStatus.OK
    second_stamp = second.get_json()["account_user"]["last_login_at"]

    assert first_stamp is not None
    assert second_stamp is not None
    assert second_stamp >= first_stamp


def test_post_me_staff_does_not_error(client, session, jwt):
    """POST /users/me for a staff user succeeds without proponent stamping."""
    claims = TestJwtClaims.staff_admin_role
    auth_guid = claims["preferred_username"]
    factory_user_model(auth_guid=auth_guid, user_type=UserType.STAFF)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=claims)

    response = client.post(ME_URL, headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["type"] == UserType.STAFF.value
    # Staff has no proponent account_user, so no last_login stamping occurs.
    assert data.get("account_user") is None


def test_post_me_reactivates_inactive_proponent(client, session, jwt):
    """An INACTIVE proponent is flipped to ACTIVE on POST /users/me."""
    headers, account_project = setup_authenticated_proponent(session, jwt)

    # Simulate the inactivity cron having marked this proponent INACTIVE.
    user = (
        session.query(User)
        .filter(User.type == UserType.PROPONENT)
        .order_by(User.id.desc())
        .first()
    )
    user.status_id = UserStatusEnum.INACTIVE.value
    db.session.add(user)
    session.flush()

    response = client.post(ME_URL, headers=headers)

    assert response.status_code == HTTPStatus.OK
    session.refresh(user)
    assert user.status_id == UserStatusEnum.ACTIVE.value


def test_post_me_unknown_proponent_returns_not_found(client, session, jwt):
    """POST /users/me for a proponent token with no user record returns 404."""
    claims = TestJwtClaims.proponent_role.copy()
    claims["preferred_username"] = "unknown-guid@example.com"
    headers = factory_auth_header(jwt=jwt, claims=claims)

    response = client.post(ME_URL, headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND
