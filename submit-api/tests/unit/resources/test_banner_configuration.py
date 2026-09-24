"""Test Banner Configuration resource.

Resource-level tests for banner configuration endpoints.
"""
import copy
from http import HTTPStatus

from submit_api.models.banner_configuration import BannerConfiguration
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import factory_auth_header, factory_user_model


BANNERS_URL = "/api/banner-configurations"
ACTIVE_URL = "/api/banner-configurations/active"


def _create_banner(banner_type="INFO", content="<p>Hello</p>", is_active=True):
    """Persist a banner configuration directly for setup."""
    banner = BannerConfiguration(
        banner_type=banner_type,
        content=content,
        is_active=is_active,
    )
    banner.save()
    return banner


def test_get_active_banner_public_returns_active(client, session):
    """Public active endpoint returns the active banner without auth."""
    _create_banner(content="<p>Active banner</p>", is_active=True)
    session.flush()

    response = client.get(ACTIVE_URL)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["content"] == "<p>Active banner</p>"
    assert data["is_active"] is True
    assert data["banner_type"] == "Info"


def test_get_active_banner_public_empty_when_none(client, session):
    """Public active endpoint returns an empty object when nothing is active."""
    _create_banner(content="<p>Inactive</p>", is_active=False)
    session.flush()

    response = client.get(ACTIVE_URL)

    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == {}


def test_create_banner_success(client, session, jwt):
    """A full_access staff user can create a banner (201)."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    payload = {
        "banner_type": "Warning",
        "content": "<p>Heads up</p>",
        "is_active": True,
    }

    response = client.post(BANNERS_URL, json=payload, headers=headers)

    assert response.status_code == HTTPStatus.CREATED
    data = response.get_json()
    assert data["content"] == "<p>Heads up</p>"
    assert data["banner_type"] == "Warning"
    assert data["is_active"] is True


def test_create_banner_deactivates_previous(client, session, jwt):
    """Creating an active banner deactivates any previously active banner."""
    previous = _create_banner(content="<p>Old</p>", is_active=True)
    session.flush()

    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    payload = {
        "banner_type": "Success",
        "content": "<p>New</p>",
        "is_active": True,
    }

    response = client.post(BANNERS_URL, json=payload, headers=headers)

    assert response.status_code == HTTPStatus.CREATED
    session.refresh(previous)
    assert previous.is_active is False


def test_create_banner_invalid_type_returns_422(client, session, jwt):
    """An invalid banner_type is rejected with 422."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    payload = {"banner_type": "Purple", "content": "<p>x</p>", "is_active": True}

    response = client.post(BANNERS_URL, json=payload, headers=headers)

    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_create_banner_unauthorized(client, session):
    """Missing auth header returns 401."""
    payload = {"banner_type": "Info", "content": "<p>x</p>", "is_active": True}

    response = client.post(BANNERS_URL, json=payload)

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_create_banner_forbidden_for_proponent(client, session, jwt):
    """A proponent (no full_access) cannot create a banner (403)."""
    claims = copy.deepcopy(TestJwtClaims.proponent_role.value)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {"banner_type": "Info", "content": "<p>x</p>", "is_active": True}

    response = client.post(BANNERS_URL, json=payload, headers=headers)

    assert response.status_code in (HTTPStatus.FORBIDDEN, HTTPStatus.UNAUTHORIZED)


def test_list_banners_returns_only_active(client, session, jwt):
    """The list endpoint returns only the active banner."""
    _create_banner(content="<p>Inactive</p>", is_active=False)
    _create_banner(content="<p>Active</p>", is_active=True)
    session.flush()

    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.get(BANNERS_URL, headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["content"] == "<p>Active</p>"


def test_update_banner_success(client, session, jwt):
    """A full_access staff user can update a banner (200)."""
    banner = _create_banner(content="<p>Before</p>", is_active=False)
    session.flush()

    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    payload = {"content": "<p>After</p>", "is_active": True}

    response = client.put(f"{BANNERS_URL}/{banner.id}", json=payload, headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["content"] == "<p>After</p>"
    assert data["is_active"] is True


def test_update_banner_not_found(client, session, jwt):
    """Updating a non-existent banner returns 404."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)
    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    response = client.put(
        f"{BANNERS_URL}/999999", json={"content": "<p>x</p>"}, headers=headers
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
