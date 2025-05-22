"""Integration tests for Staff operations on Packages."""
from http import HTTPStatus
from urllib.parse import urljoin

import pytest

from tests.utilities.factory_scenario import (
    AccountScenario,
    PackageScenario,
    ProjectScenario,
    TokenJWTClaims,
)
from tests.utilities.factory_utils import factory_auth_header
from src.submit_api.models import AccountProject as AccountProjectModel
from src.submit_api.models import Package as PackageModel
from src.submit_api.models.package import PackageStatus, NonCanonicalPackageStatus
from src.submit_api.models.update_request import UpdateRequestStatus


API_BASE_URL = "/api/packages/" # Assuming staff access is role-based, not via URL prefix
PACKAGE_BY_ID_URL = urljoin(API_BASE_URL, "{package_id}")
PACKAGE_VERSIONS_URL = urljoin(API_BASE_URL, "{original_package_id}/versions")
PACKAGE_UPDATE_REQUEST_URL = urljoin(API_BASE_URL, "{package_id}/update-request")
ACCEPT_UPDATE_REQUEST_URL = urljoin(PACKAGE_UPDATE_REQUEST_URL, "/{update_request_id}")

# Helper function (adapted from test_package.py)
def _create_base_entities_for_package(session, account_scenario_val, project_scenario_val, package_scenario_val, proponent_auth_header, client):
    """
    Helper function to create an Account, a Project, link them via AccountProject,
    and then create a package by a proponent.
    Returns the created package object.
    """
    account_data = account_scenario_val.value
    project_data = project_scenario_val.value
    project_data['proponent_id'] = account_data['proponent_id'] # Ensure consistency

    account = AccountScenario.create(account_data)
    session.add(account)
    session.flush()

    project = ProjectScenario.create(project_data)
    session.add(project)
    session.flush()

    account_project = AccountProjectModel.create_account_project(
        account_id=account.id,
        project_id=project.id,
        session=session
    )
    session.commit() # Commit to get account_project.id

    # Create package using proponent client/auth
    package_creation_payload = {
        "name": package_scenario_val.value["name"],
        "type_id": package_scenario_val.value["type_id"],
    }
    # Note: The URL for package creation by proponent is different from staff base URL
    # It's /api/packages/account-projects/{account_project_id}
    proponent_package_creation_url = f"/api/packages/account-projects/{account_project.id}"
    response = client.post(proponent_package_creation_url, json=package_creation_payload, headers=proponent_auth_header)
    assert response.status_code == HTTPStatus.CREATED
    created_package_data = response.json
    
    # Fetch the full package model as it's more useful than just JSON
    package_model = PackageModel.query.get(created_package_data["id"])
    session.add(package_model) # ensure it's in the session for subsequent operations
    session.commit()
    return package_model


# Staff Auth Headers
@pytest.fixture
def eao_view_auth_header(jwt):
    """Generate auth header for EAO View."""
    return factory_auth_header(jwt=jwt, claims=TokenJWTClaims.STAFF_EAO_VIEW.value)


@pytest.fixture
def eao_create_auth_header(jwt):
    """Generate auth header for EAO Create."""
    return factory_auth_header(jwt=jwt, claims=TokenJWTClaims.STAFF_EAO_CREATE.value)


@pytest.fixture
def eao_edit_auth_header(jwt): # Added for completeness, might be needed later
    """Generate auth header for EAO Edit."""
    return factory_auth_header(jwt=jwt, claims=TokenJWTClaims.STAFF_EAO_EDIT.value)


# Proponent Auth Header (for initial package creation by a proponent)
@pytest.fixture
def proponent_auth_header(jwt):
    """Generate auth header for a basic proponent."""
    return factory_auth_header(jwt=jwt, claims=TokenJWTClaims.PROPONENT_CREATE_BASIC.value)


def test_staff_get_package_by_id(client, eao_view_auth_header, proponent_auth_header, session, jwt):
    """Test staff fetching a package by its ID."""
    # Create a package by a proponent
    package_model = _create_base_entities_for_package(
        session,
        AccountScenario.account1, # Using specific scenarios
        ProjectScenario.project1,
        PackageScenario.package1,
        proponent_auth_header,
        client
    )
    package_id = package_model.id

    # Staff fetches the package
    url = PACKAGE_BY_ID_URL.format(package_id=package_id)
    response = client.get(url, headers=eao_view_auth_header)

    assert response.status_code == HTTPStatus.OK
    response_json = response.json
    assert response_json["id"] == package_id
    assert response_json["name"] == PackageScenario.package1.value["name"]
    # Add checks for staff-specific fields if StaffPackageSchema differs significantly
    # For now, assume it's similar to the standard PackageSchema but accessible by staff.
    # Example: Check if 'status' is present, as it's a key field.
    assert "status" in response_json
    # If StaffPackageSchema includes more details, like account_project information:
    assert "account_project_id" in response_json
    assert response_json["account_project_id"] == package_model.account_project_id


def test_staff_get_package_versions(client, eao_view_auth_header, proponent_auth_header, session, jwt):
    """Test staff fetching versions of a package."""
    # Create a base package by a proponent
    package_model = _create_base_entities_for_package(
        session,
        AccountScenario.account2, # Using different scenarios to avoid data collision
        ProjectScenario.project2,
        PackageScenario.package2, # Using a different package scenario
        proponent_auth_header,
        client
    )
    original_package_id = package_model.id # This is the first version of the package

    # Staff fetches the package versions
    # The versions endpoint expects the ID of the *original* package.
    # If package_model.id is from a versioned record, we might need package_model.version.original_package_id
    # However, for a newly created package, its own ID is usually the original_package_id.
    # Let's assume package_model.id can serve as original_package_id for a package that hasn't been versioned yet.
    # If the package model has a direct 'original_package_id' field, that should be preferred.
    # Looking at Package model, it has version_id -> PackageVersion, which has original_package_id.
    # For a newly created package, package.version might be None or its original_package_id points to itself.
    # The helper creates a package. Let's check its structure regarding versioning.
    # The Package model has `version = db.relationship('PackageVersion')`.
    # `PackageVersion` has `original_package_id = Column(db.Integer, ForeignKey('packages.id'))`.
    # For a brand new package, it is its own original.

    # If the package was created and has a version object, use its original_package_id
    # If the package itself is the first one, its id is the original_package_id
    # The _create_base_entities_for_package returns a PackageModel.
    # A newly created package might not have its version relationship immediately populated in the way
    # that original_package_id is set up for subsequent versions.
    # For the first version, its own ID is the original_package_id.
    # The endpoint /packages/{original_package_id}/versions implies that original_package_id is a Package.id
    # that is marked as an original.

    # Let's assume the `package_model.id` of the initially created package is the `original_package_id`.
    # This is typical unless the creation process immediately creates a versioned record pointing to another original.
    # Given our helper, `package_model.id` is the correct ID to use.

    url = PACKAGE_VERSIONS_URL.format(original_package_id=original_package_id)
    response = client.get(url, headers=eao_view_auth_header)

    assert response.status_code == HTTPStatus.OK
    response_json = response.json
    assert isinstance(response_json, list), "Response should be a list of versions"
    # For a newly created package, it should appear as the first version of itself.
    assert len(response_json) >= 1, "Should return at least one version (the package itself)"
    
    found_self = False
    for version_info in response_json:
        # The schema of items in this list could be PackageVersionSchema or PackageSchema.
        # Assuming it returns information identifiable as the package we created.
        if version_info.get("id") == original_package_id:
            found_self = True
            # Add more checks based on expected schema (e.g., version number)
            # e.g. assert version_info.get("version_name") or some version identifier is present
            break
    assert found_self, f"The package itself (id: {original_package_id}) was not found in its versions list."
    # Further checks could involve creating a new version of the package and ensuring both appear.
    # This would require an endpoint to create new versions, which is not explicitly part of this test's scope.


def test_staff_create_update_request(client, eao_create_auth_header, proponent_auth_header, session, jwt):
    """Test staff creating an update request for a package."""
    # 1. Create a package by a proponent
    package_model = _create_base_entities_for_package(
        session,
        AccountScenario.default_account, # Using default scenarios
        ProjectScenario.default_project,
        PackageScenario.default_package,
        proponent_auth_header,
        client
    )
    package_id = package_model.id

    # 2. Staff creates an update request
    update_request_payload = {"reason": "Test reason for update request"}
    url = PACKAGE_UPDATE_REQUEST_URL.format(package_id=package_id)
    response = client.post(url, json=update_request_payload, headers=eao_create_auth_header)

    assert response.status_code == HTTPStatus.CREATED, f"Error: {response.text}"
    response_json = response.json

    # The response should be the Package schema, which includes 'update_requests' list
    assert "update_requests" in response_json
    assert isinstance(response_json["update_requests"], list)
    assert len(response_json["update_requests"]) > 0

    # Check the details of the created update request
    created_ur = response_json["update_requests"][0]
    assert created_ur["reason"] == update_request_payload["reason"]
    assert created_ur["status"] == UpdateRequestStatus.CREATED.value # Default status for new UR
    assert "id" in created_ur
    update_request_id = created_ur["id"] # Store for potential use

    # Verify package status changed to UPDATE_REQUESTED (if this is the expected behavior)
    # The Package model has `status = Column(db.ARRAY(Enum(PackageStatus)))`
    # The NonCanonicalPackageStatus has UPDATE_REQUESTED
    # The endpoint might add this to the package's status array.
    assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value in response_json["non_canonical_status"]

    # Verify in DB
    session.refresh(package_model) # Refresh to get updates from the transaction
    assert package_model.non_canonical_status is not None
    assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value in package_model.non_canonical_status
    
    # Check the UpdateRequest object in the database
    assert len(package_model.all_update_requests) == 1
    db_update_request = package_model.all_update_requests[0]
    assert db_update_request.id == update_request_id
    assert db_update_request.reason == update_request_payload["reason"]
    assert db_update_request.status == UpdateRequestStatus.CREATED.value

    # Store for next test if needed (though direct creation is better for test independence)
    # session.info_holder = {'package_id': package_id, 'update_request_id': update_request_id}
    # Re-creating entities per test is generally preferred.


def test_staff_accept_update_request(client, eao_create_auth_header, proponent_auth_header, session, jwt):
    """Test staff accepting an update request for a package."""
    # 1. Create a package by a proponent
    package_model = _create_base_entities_for_package(
        session,
        AccountScenario.account1, # Using different scenarios to avoid collision
        ProjectScenario.project1,
        PackageScenario.package1,
        proponent_auth_header,
        client
    )
    package_id = package_model.id

    # 2. Staff creates an update request
    update_request_payload = {"reason": "Test reason for accept test"}
    create_ur_url = PACKAGE_UPDATE_REQUEST_URL.format(package_id=package_id)
    create_ur_response = client.post(create_ur_url, json=update_request_payload, headers=eao_create_auth_header)
    assert create_ur_response.status_code == HTTPStatus.CREATED
    created_ur_json = create_ur_response.json["update_requests"][0]
    update_request_id = created_ur_json["id"]

    # 3. Staff accepts the update request
    # The endpoint seems to be PATCH /api/packages/{package_id}/update-request/{update_request_id}
    # The variable ACCEPT_UPDATE_REQUEST_URL is defined as urljoin(PACKAGE_UPDATE_REQUEST_URL, "/{update_request_id}")
    # which translates to /api/packages/{package_id}/update-request/{update_request_id}
    # This seems correct.
    accept_url = ACCEPT_UPDATE_REQUEST_URL.format(package_id=package_id, update_request_id=update_request_id)
    
    # The resource file for PATCH update-request/{id} shows no explicit request body schema.
    # Assuming an empty JSON payload is acceptable if Content-Type is application/json.
    accept_response = client.patch(accept_url, json={}, headers=eao_create_auth_header)

    assert accept_response.status_code == HTTPStatus.OK, f"Error: {accept_response.text}"
    accept_response_json = accept_response.json

    # Verify the update request status changed to ACCEPTED
    # The response is UpdateRequestSchema
    assert accept_response_json["id"] == update_request_id
    assert accept_response_json["status"] == UpdateRequestStatus.ACCEPTED.value

    # Optionally, verify package status or non_canonical_status if it changes upon UR acceptance.
    # For example, if UPDATE_REQUESTED is removed.
    refreshed_package = PackageModel.query.get(package_id)
    session.refresh(refreshed_package)
    
    # Check the DB state of the UpdateRequest
    db_update_request = next((ur for ur in refreshed_package.all_update_requests if ur.id == update_request_id), None)
    assert db_update_request is not None
    assert db_update_request.status == UpdateRequestStatus.ACCEPTED.value

    # Check if NonCanonicalPackageStatus.UPDATE_REQUESTED is removed from the package
    # This depends on the business logic of what happens when an UR is accepted.
    # If it's removed, the following assertion should pass.
    # If it's not, this assertion should be removed or modified.
    # For now, we'll assume it's removed for a clean state.
    if refreshed_package.non_canonical_status and NonCanonicalPackageStatus.UPDATE_REQUESTED.value in refreshed_package.non_canonical_status:
        # This is an assumption. If the test fails here, the logic might be different.
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value not in refreshed_package.non_canonical_status
    
    # The package status itself might also change to 'UPDATED' or similar.
    # This also depends on business logic.
    # e.g. assert NonCanonicalPackageStatus.UPDATED.value in refreshed_package.non_canonical_status
    # The provided spec for PATCH notes `package.set_status(NonCanonicalPackageStatus.UPDATED)`
    assert NonCanonicalPackageStatus.UPDATED.value in refreshed_package.non_canonical_status
