"""Tests for User resource endpoints."""
import copy
from http import HTTPStatus

from faker import Faker

from submit_api.models.user import UserType
from submit_api.models.user_status import UserStatusEnum
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import factory_auth_header, factory_user_model

fake = Faker()

USERS_ME_URL = "/api/users/me"


class TestCurrentUserPost:
    """Tests for the POST /users/me endpoint."""

    def test_get_current_user_success(self, client, session, jwt):
        """Test that an active user can retrieve their profile."""
        claims = copy.deepcopy(TestJwtClaims.staff_admin_role.value)
        auth_guid = claims['preferred_username']
        factory_user_model(auth_guid=auth_guid, user_type=UserType.STAFF)
        session.flush()

        headers = factory_auth_header(jwt=jwt, claims=claims)
        response = client.post(USERS_ME_URL, headers=headers)

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert data["auth_guid"] == auth_guid

    def test_get_current_user_revoked_returns_403(self, client, session, jwt):
        """Test that a revoked user receives a 403 Forbidden response."""
        claims = copy.deepcopy(TestJwtClaims.proponent_role.value)
        auth_guid = claims['preferred_username']
        user = factory_user_model(auth_guid=auth_guid, user_type=UserType.PROPONENT)
        user.status_id = UserStatusEnum.ACCESS_REVOKED.value
        session.flush()

        headers = factory_auth_header(jwt=jwt, claims=claims)
        response = client.post(USERS_ME_URL, headers=headers)

        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_get_current_user_not_found_returns_404(self, client, session, jwt):
        """Test that a user not in the system receives a 404 response."""
        claims = copy.deepcopy(TestJwtClaims.proponent_role.value)
        # Use a guid that doesn't exist in the DB
        claims['preferred_username'] = fake.uuid4()
        session.flush()

        headers = factory_auth_header(jwt=jwt, claims=claims)
        response = client.post(USERS_ME_URL, headers=headers)

        assert response.status_code == HTTPStatus.NOT_FOUND

    def test_get_current_user_no_auth_returns_401(self, client):
        """Test that a request without auth token returns 401."""
        response = client.post(USERS_ME_URL)

        assert response.status_code == HTTPStatus.UNAUTHORIZED
