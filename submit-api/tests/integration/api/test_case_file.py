"""Test suite for case file."""

import copy
import json
from datetime import datetime
from http import HTTPStatus
from urllib.parse import urljoin

import pytest
from faker import Faker

from compliance_api.models.case_file import CaseFileStatusEnum
from compliance_api.services.case_file import CaseFileService
from tests.utilities.factory_scenario import CasefileScenario, StaffScenario


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


@pytest.fixture
def created_staff(mocker):
    """Create staff."""
    user_data = StaffScenario.default_data.value
    auth_user_guid = fake.word()
    user_data["auth_user_guid"] = auth_user_guid
    new_user = StaffScenario.create(user_data)
    return new_user


def test_get_case_file_initiation_options(client, auth_header):
    """Get complaint sources."""
    url = urljoin(API_BASE_URL, "case-files/initiation-options")
    result = client.get(url, headers=auth_header)
    assert len(result.json) == 2
    assert result.status_code == HTTPStatus.OK


def test_create_case_file_without_file_number(client, auth_header, created_staff):
    """Create case file with basic fields."""
    url = urljoin(API_BASE_URL, "case-files")
    case_file_data = CasefileScenario.default_value.value
    case_file_data["primary_officer_id"] = created_staff.id
    result = client.post(
        url, data=json.dumps(CasefileScenario.default_value.value), headers=auth_header
    )
    assert result.status_code == HTTPStatus.CREATED
    assert result.json["case_file_number"] == f"{datetime.now().year}0001"
    assert result.json["case_file_status"] == CaseFileStatusEnum.OPEN.value


def test_create_case_file_with_file_number(client, auth_header):
    """Create case file with file number."""
    user_data = StaffScenario.default_data.value
    auth_user_guid = fake.word()
    user_data["auth_user_guid"] = auth_user_guid
    new_user = StaffScenario.create(user_data)
    url = urljoin(API_BASE_URL, "case-files")
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    case_file_data["case_file_number"] = "XYZ"
    case_file_data["primary_officer_id"] = new_user.id
    case_file_data["officer_ids"] = [new_user.id]
    result = client.post(url, data=json.dumps(case_file_data), headers=auth_header)
    assert result.json["case_file_number"] == "XYZ"
    assert result.json["case_file_status"] == CaseFileStatusEnum.OPEN.value
    assert result.json["primary_officer_id"] == new_user.id
    assert result.status_code == HTTPStatus.CREATED

    officers = CaseFileService.get_other_officers(result.json["id"])
    assert len(officers) == 1
    assert officers[0].id == new_user.id


def test_create_case_file_with_existing_case_file_number(
    client, auth_header, created_staff
):
    """Create case file with basic fields."""
    url = urljoin(API_BASE_URL, "case-files")
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    case_file_data["case_file_number"] = "XYZ"
    case_file_data["primary_officer_id"] = created_staff.id
    result = client.post(url, data=json.dumps(case_file_data), headers=auth_header)
    print(result.json)
    assert result.status_code == HTTPStatus.CONFLICT


def test_get_case_files_by_project_id(client, auth_header):
    """Get case files by project id."""
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    CaseFileService.create(case_file_data)
    url = urljoin(API_BASE_URL, "case-files?project_id=1")
    result = client.get(url, headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert len(result.json) == 3


def test_get_case_files(client, auth_header):
    """Get all case files."""
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    case_file_data["project_id"] = 2
    CaseFileService.create(case_file_data)
    url = urljoin(API_BASE_URL, "case-files")
    result = client.get(url, headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert len(result.json) == 4


def test_get_case_file_by_id(client, auth_header):
    """Test case file by id."""
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    case_file_data["project_id"] = 2
    created_case_file = CaseFileService.create(case_file_data)
    url = urljoin(API_BASE_URL, f"case-files/{created_case_file.id}")
    result = client.get(url, headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert result.json["id"] == created_case_file.id
    assert result.json["case_file_status"] == CaseFileStatusEnum.OPEN.value


def test_get_case_file_officers(client, auth_header):
    """Create case file with file number."""
    user_data = StaffScenario.default_data.value
    auth_user_guid = fake.word()
    user_data["auth_user_guid"] = auth_user_guid
    new_user = StaffScenario.create(user_data)
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    case_file_data["case_file_number"] = fake.word()
    case_file_data["primary_officer_id"] = new_user.id
    case_file_data["officer_ids"] = [new_user.id]
    created_case_file = CaseFileService.create(case_file_data)
    url = urljoin(API_BASE_URL, f"case-files/{created_case_file.id}/officers")
    result = client.get(url, headers=auth_header)
    print(result.json)
    assert result.status_code == HTTPStatus.OK
    assert len(result.json) == 1
    assert result.json[0].get("id") == new_user.id


def test_get_case_file_by_number(client, auth_header):
    """Get case file by case file number."""
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    case_file_data["case_file_number"] = fake.word()
    created_case_file = CaseFileService.create(case_file_data)
    url = urljoin(
        API_BASE_URL,
        f"case-files/case-file-numbers/{case_file_data['case_file_number']}",
    )
    result = client.get(url, headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert result.json["id"] == created_case_file.id
    assert result.json["case_file_number"] == case_file_data["case_file_number"]


def test_case_file_update(client, auth_header, created_staff):
    """Update case file."""
    #  creating case file without officers or primary officer
    case_file_data = copy.copy(CasefileScenario.default_value.value)
    case_file_data["case_file_number"] = fake.word()
    case_file_data["primary_officer_id"] = created_staff.id
    created_case_file = CaseFileService.create(case_file_data)
    url = urljoin(
        API_BASE_URL,
        f"case-files/case-file-numbers/{case_file_data['case_file_number']}",
    )
    result = client.get(url, headers=auth_header)
    print(result.json)
    assert result.status_code == HTTPStatus.OK
    officers = CaseFileService.get_other_officers(result.json["id"])
    assert len(officers) == 0
    #  create one user
    user_data = StaffScenario.default_data.value
    auth_user_guid = fake.word()
    user_data["auth_user_guid"] = auth_user_guid
    new_user = StaffScenario.create(user_data)
    #  update the payload by adding primary officer and officers
    case_file_data["primary_officer_id"] = new_user.id
    case_file_data["officer_ids"] = [new_user.id]
    url = urljoin(API_BASE_URL, f"case-files/{created_case_file.id}")
    result = client.patch(url, data=json.dumps(case_file_data), headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert result.json["primary_officer_id"] == new_user.id
    officers = CaseFileService.get_other_officers(result.json["id"])
    assert len(officers) == 1
    assert officers[0].id == new_user.id
    #  update the payload by making the officer list empty
    case_file_data["primary_officer_id"] = new_user.id
    case_file_data["officer_ids"] = []
    url = urljoin(API_BASE_URL, f"case-files/{created_case_file.id}")
    result = client.patch(url, data=json.dumps(case_file_data), headers=auth_header)

    assert result.status_code == HTTPStatus.OK
    assert result.json["primary_officer_id"] == new_user.id
    officers = CaseFileService.get_other_officers(result.json["id"])
    assert len(officers) == 0
