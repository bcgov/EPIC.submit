"""Integration tests for the Package API."""
from http import HTTPStatus
from urllib.parse import urljoin

import pytest

from tests.utilities.factory_scenario import AccountScenario, PackageScenario, ProjectScenario
from src.submit_api.models import AccountProject as AccountProjectModel
from src.submit_api.models import Package as PackageModel
from src.submit_api.models.package import PackageStatus # For test_update_package_state

API_BASE_URL = "/api/packages/"
ACCOUNT_PROJECT_PACKAGES_URL = urljoin(API_BASE_URL, "account-projects/{account_project_id}")
PACKAGE_STATE_URL = urljoin(API_BASE_URL, "{package_id}/state")

# Helper function to create AccountProject
def _create_account_project(session, account_data, project_data):
    """Helper function to create an Account and a Project, then link them via AccountProject."""
    account = AccountScenario.create(account_data)
    session.add(account)
    session.flush() # Ensure account.id is available

    project = ProjectScenario.create(project_data)
    session.add(project)
    session.flush() # Ensure project.id is available

    # Check if AccountProject already exists to prevent duplicates if proponent_id/project_name are reused
    # This is a simplified check; real applications might have more complex logic or constraints.
    # For tests, we often want fresh entities.
    account_project = AccountProjectModel.create_account_project(
        account_id=account.id,
        project_id=project.id,
        session=session
    )
    session.commit()
    return account_project


def test_create_package(client, auth_header, session):
    """Test creating a new package for an account project."""
    # Setup AccountProject
    account_data = AccountScenario.account1.value
    project_data = ProjectScenario.project1.value
    # Ensure proponent_id for project and account align if necessary for data integrity
    # For this test, ProjectScenario.project1 has proponent_id=1, AccountScenario.account1 has proponent_id=1
    project_data['proponent_id'] = account_data['proponent_id']


    account_project = _create_account_project(session, account_data, project_data)
    account_project_id = account_project.id

    package_data = PackageScenario.default_package.value.copy()
    # Remove fields that are auto-generated or set by the backend
    # account_project_id is part of the URL, not the payload here.
    # type_id needs to exist in package_types table. Assuming 1 exists from default data.
    # status and active are typically set by backend based on initial creation.
    # Let's assume the scenario provides a valid basic structure.
    # The endpoint is /api/packages/account-projects/{account_project_id}
    # The payload should be based on PackageSchema, which might not be identical to PackageModel structure.
    # Based on common patterns, the payload might look like:
    # { "name": "Package Name", "type_id": 1, ... other relevant fields ... }
    # PackageScenario.default_package seems to include fields like status, active, account_project_id.
    # We should only send fields that the POST endpoint expects for creation.
    # Let's assume the endpoint takes 'name' and 'type_id'.
    # The provided spec for POST /account-projects/{id}/packages in the resource file implies it uses CreatePackageArgsSchema.
    # This schema is not defined in the prompt, so we'll make a reasonable assumption.
    # Typically, this means name, type_id. `submitted_by` could be inferred from auth token.
    # `status` is usually set by the service.

    creation_payload = {
        "name": package_data["name"],
        "type_id": package_data["type_id"], # Assuming type_id from scenario is valid
    }

    url = ACCOUNT_PROJECT_PACKAGES_URL.format(account_project_id=account_project_id)
    response = client.post(url, json=creation_payload, headers=auth_header)

    assert response.status_code == HTTPStatus.CREATED
    response_json = response.json
    assert response_json["name"] == creation_payload["name"]
    assert response_json["type_id"] == creation_payload["type_id"]
    assert "id" in response_json
    assert response_json["status"] == [PackageStatus.NEW_SUBMISSION.value] # Default status

    # Verify in DB
    created_package_model = PackageModel.query.get(response_json["id"])
    assert created_package_model is not None
    assert created_package_model.name == creation_payload["name"]
    assert created_package_model.account_project_id == account_project_id
    # Store for other tests
    # session.info_holder = {'package_id': response_json["id"], 'account_project_id': account_project_id}
    # It's generally better to create entities as needed per test rather than relying on session.info_holder
    # For simplicity in this chain, we might reuse, but it's an anti-pattern for independent tests.


def test_get_package_by_id(client, auth_header, session):
    """Test fetching a package by its ID."""
    # 1. Create AccountProject
    account_data = AccountScenario.account2.value # Use different data to avoid collisions if tests run in parallel or share DB state
    project_data = ProjectScenario.project2.value
    project_data['proponent_id'] = account_data['proponent_id']
    account_project = _create_account_project(session, account_data, project_data)
    account_project_id = account_project.id

    # 2. Create Package
    package_creation_payload = {
        "name": "Test Package for Get By ID",
        "type_id": 1 # Assuming package_type 1 exists
    }
    create_url = ACCOUNT_PROJECT_PACKAGES_URL.format(account_project_id=account_project_id)
    create_response = client.post(create_url, json=package_creation_payload, headers=auth_header)
    assert create_response.status_code == HTTPStatus.CREATED
    created_package_json = create_response.json
    package_id = created_package_json["id"]

    # 3. Fetch the package by ID
    get_url = urljoin(API_BASE_URL, str(package_id))
    get_response = client.get(get_url, headers=auth_header)

    assert get_response.status_code == HTTPStatus.OK
    fetched_package_json = get_response.json
    assert fetched_package_json["id"] == package_id
    assert fetched_package_json["name"] == package_creation_payload["name"]
    assert fetched_package_json["type_id"] == package_creation_payload["type_id"]
    assert fetched_package_json["account_project_id"] == account_project_id


def test_get_non_existent_package(client, auth_header):
    """Test fetching a non-existent package."""
    non_existent_package_id = 99999  # An ID that is unlikely to exist
    url = urljoin(API_BASE_URL, str(non_existent_package_id))
    response = client.get(url, headers=auth_header)

    # Based on common API patterns, a non-existent resource should return 404.
    # The specific status code (404 vs 400) should be verified against the API specification/resource file.
    # Assuming 404 for now.
    assert response.status_code == HTTPStatus.NOT_FOUND


def test_update_package_state(client, auth_header, session):
    """Test updating the state of a package."""
    # 1. Create AccountProject
    account_data = AccountScenario.default_account.value # Using default, ensure it's unique or test DB handles it
    project_data = ProjectScenario.default_project.value
    # Ensure proponent_ids match for consistency if AccountProject creation implies this link
    project_data['proponent_id'] = account_data['proponent_id']
    account_project = _create_account_project(session, account_data, project_data)
    account_project_id = account_project.id

    # 2. Create Package
    package_creation_payload = {
        "name": "Test Package for State Update",
        "type_id": 1 # Assuming package_type 1 exists
    }
    create_url = ACCOUNT_PROJECT_PACKAGES_URL.format(account_project_id=account_project_id)
    create_response = client.post(create_url, json=package_creation_payload, headers=auth_header)
    assert create_response.status_code == HTTPStatus.CREATED
    created_package_json = create_response.json
    package_id = created_package_json["id"]

    # 3. Update the package state
    # Valid states need to be known. Assuming 'SUBMITTED' is a valid state to transition to.
    # The PackageStatus enum can be consulted for valid states.
    new_state_payload = {"state": PackageStatus.SUBMITTED.value}
    update_state_url = PACKAGE_STATE_URL.format(package_id=package_id)
    update_response = client.post(update_state_url, json=new_state_payload, headers=auth_header)

    assert update_response.status_code == HTTPStatus.OK
    updated_package_json = update_response.json
    # The response for a state update might vary. It could be the full package, or just a confirmation.
    # Assuming it returns the package with the new state.
    assert PackageStatus.SUBMITTED.value in updated_package_json["status"] # Status is an array

    # 4. Optionally, verify by fetching the package again
    get_url = urljoin(API_BASE_URL, str(package_id))
    get_response = client.get(get_url, headers=auth_header)
    assert get_response.status_code == HTTPStatus.OK
    fetched_package_json = get_response.json
    assert PackageStatus.SUBMITTED.value in fetched_package_json["status"]
