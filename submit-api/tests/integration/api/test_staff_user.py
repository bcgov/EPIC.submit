"""Test suite for staff user."""

import json
from http import HTTPStatus
from urllib.parse import urljoin

import pytest
from faker import Faker

from tests.utilities.factory_scenario import StaffScenario


API_BASE_URL = "/api/"
fake = Faker()


@pytest.fixture
def mock_auth_service(mocker):
    """Fixture to mock AuthService methods."""
    mock_get_user_by_guid = mocker.patch(
        "compliance_api.services.authorize_service.auth_service.AuthService.get_epic_user_by_guid"
    )
    mock_get_user_by_guid.return_value = {
        "first_name": fake.word(),
        "last_name": fake.word(),
        "username": fake.word(),  # Fixed the key to "username"
    }

    mock_update_user_group = mocker.patch(
        "compliance_api.services.authorize_service.auth_service.AuthService.update_user_group"
    )
    mock_update_user_group.return_value = {}

    yield mock_get_user_by_guid, mock_update_user_group


def test_create_staff_user_mandatory(mock_auth_service, mocker, client, auth_header):
    """Create staff user."""
    url = urljoin(API_BASE_URL, "staff-users")
    mock_get_user_by_guid = mocker.patch(
        "compliance_api.services.authorize_service.auth_service.AuthService.get_epic_user_by_guid"
    )
    firstname = fake.word()
    lastname = fake.word()
    username = fake.word()
    mock_get_user_by_guid.return_value = {
        "first_name": firstname,
        "last_name": lastname,
        "username": username,  # Fixed the key to "username"
    }
    staff_user_data = {
        "auth_user_guid": username,
        "permission": "VIEWER",
        "position_id": 1,
    }

    result = client.post(url, data=json.dumps(staff_user_data), headers=auth_header)
    print(result.json)
    assert result.status_code == HTTPStatus.CREATED
    assert result.json["auth_user_guid"] == staff_user_data["auth_user_guid"]
    assert result.json["permission"] == "Viewer"
    assert result.json["position_id"] == staff_user_data["position_id"]
    assert result.json["first_name"] == firstname
    assert result.json["last_name"] == lastname


def test_create_staff_user_all_fields(mock_auth_service, mocker, client, auth_header):
    """Create staff user."""
    user_data = StaffScenario.default_data.value
    auth_user_guid = fake.word()
    user_data["auth_user_guid"] = auth_user_guid
    new_user = StaffScenario.create(user_data)
    url = urljoin(API_BASE_URL, "staff-users")
    mock_get_user_by_guid = mocker.patch(
        "compliance_api.services.authorize_service.auth_service.AuthService.get_epic_user_by_guid"
    )
    firstname = fake.word()
    lastname = fake.word()
    username = fake.word()
    mock_get_user_by_guid.return_value = {
        "first_name": firstname,
        "last_name": lastname,
        "username": username,  # Fixed the key to "username"
    }
    staff_user_data = {
        "auth_user_guid": username,
        "permission": "USER",
        "position_id": 1,
        "deputy_director_id": new_user.id,
        "supervisor_id": new_user.id,
    }

    result = client.post(url, data=json.dumps(staff_user_data), headers=auth_header)

    assert result.status_code == HTTPStatus.CREATED
    assert result.json["auth_user_guid"] == staff_user_data["auth_user_guid"]
    assert result.json["permission"] == "User"
    assert result.json["position_id"] == staff_user_data["position_id"]
    assert result.json["deputy_director_id"] == staff_user_data["deputy_director_id"]
    assert result.json["supervisor_id"] == staff_user_data["supervisor_id"]
    assert result.json["first_name"] == firstname
    assert result.json["last_name"] == lastname


def test_create_existing_user(mock_auth_service, client, auth_header):
    """Create an existing user."""
    url = urljoin(API_BASE_URL, "staff-users")
    user_data = StaffScenario.default_data.value
    auth_user_guid = fake.word()
    user_data["auth_user_guid"] = auth_user_guid
    StaffScenario.create(user_data)

    user_payload = {
        "auth_user_guid": auth_user_guid,
        "permission": "VIEWER",
        "position_id": 1,
    }

    result = client.post(url, data=json.dumps(user_payload), headers=auth_header)

    assert result.status_code == HTTPStatus.CONFLICT


def test_get_users(mock_auth_service, mocker, client, auth_header):
    """Create an existing user."""
    url = urljoin(API_BASE_URL, "staff-users")
    user_data = StaffScenario.default_data.value
    auth_user_guid1 = fake.text(max_nb_chars=20)
    user_data["auth_user_guid"] = auth_user_guid1
    StaffScenario.create(user_data)
    auth_user_guid2 = fake.text(max_nb_chars=20)
    user_data["auth_user_guid"] = auth_user_guid2
    StaffScenario.create(user_data)
    mock_get_epic_users_by_app = mocker.patch(
        "compliance_api.services.authorize_service.auth_service.AuthService.get_epic_users_by_app"
    )
    epic_users = StaffScenario.epic_auth_users.value
    epic_users[0]["username"] = auth_user_guid1
    epic_users[1]["username"] = auth_user_guid2

    mock_get_epic_users_by_app.return_value = epic_users

    result = client.get(url, headers=auth_header)
    print(result.json)
    filtered_user = next(
        (user for user in result.json if user["auth_user_guid"] == auth_user_guid1),
        None,
    )
    print(filtered_user)
    assert filtered_user is not None
    assert filtered_user.get("permission", None) == "User"
    assert result.status_code == HTTPStatus.OK


def test_get_user_by_id(mock_auth_service, client, auth_header):
    """Get user by id."""
    staff_data = StaffScenario.default_data.value
    staff_data["auth_user_guid"] = fake.word()
    created_user = StaffScenario.create(staff_data)
    url = urljoin(API_BASE_URL, f"staff-users/{created_user.id}")

    result = client.get(url, headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert result.json["id"] == created_user.id


def test_get_user_by_id_not_found(mock_auth_service, client, auth_header):
    """Get user by id not found."""
    url = urljoin(API_BASE_URL, "staff-users/9999")

    result = client.get(url, headers=auth_header)

    assert result.status_code == HTTPStatus.NOT_FOUND


def test_update_staff(mock_auth_service, client, auth_header):
    """Update staff user."""
    staff_data = StaffScenario.default_data.value
    staff_data["auth_user_guid"] = fake.word()
    created_user = StaffScenario.create(staff_data)
    staff_data["auth_user_guid"] = fake.word()
    another_user = StaffScenario.create(staff_data)
    url = urljoin(API_BASE_URL, f"staff-users/{created_user.id}")
    update_payload = {
        "position_id": 2,
        "deputy_director_id": another_user.id,
        "supervisor_id": another_user.id,
        "permission": "VIEWER",
    }

    result = client.patch(url, data=json.dumps(update_payload), headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert result.json["deputy_director_id"] == update_payload["deputy_director_id"]
    assert result.json["supervisor_id"] == update_payload["supervisor_id"]


def test_user_update_non_existing(mock_auth_service, client, auth_header):
    """Update non-existing user."""
    url = urljoin(API_BASE_URL, "staff-users/9999")
    update_payload = {
        "position_id": 2,
        "deputy_directory_id": 1,
        "supervisor_id": 1,
        "permission": "VIEWER",
    }
    result = client.patch(url, data=json.dumps(update_payload), headers=auth_header)
    print(result.json)
    assert result.status_code == HTTPStatus.NOT_FOUND


def test_delete_user(mock_auth_service, client, auth_header):
    """Delete user."""
    staff_data = StaffScenario.default_data.value
    staff_data["auth_user_guid"] = fake.word()
    created_user = StaffScenario.create(staff_data)
    url = urljoin(API_BASE_URL, f"staff-users/{created_user.id}")

    result = client.delete(url, headers=auth_header)

    assert result.status_code == HTTPStatus.OK

    result = client.get(url, headers=auth_header)

    assert result.status_code == HTTPStatus.NOT_FOUND
