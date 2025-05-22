"""Integration tests for the Submission API (Proponent)."""
from http import HTTPStatus
from urllib.parse import urljoin

import pytest

from tests.utilities.factory_scenario import (
    AccountScenario,
    PackageScenario,
    ProjectScenario,
    SubmissionScenario,
    TokenJWTClaims # Will be used for proponent_auth_header_for_creation
)
from tests.utilities.factory_utils import factory_auth_header
from src.submit_api.models import (
    AccountProject as AccountProjectModel,
    Package as PackageModel,
    Item as ItemModel, # For creating the submission_item_id
    Submission as SubmissionModel
)
from src.submit_api.models.submission import SubmissionType, SubmissionStatus # For payload and verification


API_BASE_URL = "/api/submissions/"
SUBMISSION_ITEM_URL = urljoin(API_BASE_URL, "items/{submission_item_id}")
SUBMISSION_BY_ID_BASE_URL = API_BASE_URL # e.g. /api/submissions/{submission_id}/form
SUBMISSION_FORM_URL = urljoin(API_BASE_URL, "{submission_id}/form")
SUBMISSION_VERSIONS_URL = urljoin(API_BASE_URL, "{submission_id}/versions")
SUBMISSION_DOCUMENT_URL = urljoin(API_BASE_URL, "{submission_id}/document")


# Auth header for proponent actions (especially for creation steps in helper)
@pytest.fixture
def proponent_creator_auth_header(jwt):
    """Generate auth header for a proponent with creation rights."""
    return factory_auth_header(jwt=jwt, claims=TokenJWTClaims.PROPONENT_CREATE_BASIC.value)

# Default auth_header will use TokenJWTClaims.default, which should be sufficient for a generic proponent.
# If specific proponent roles are needed beyond basic creation, more fixtures can be added.
# For now, proponent_creator_auth_header will be used when creating entities in the helper.
# The standard 'auth_header' fixture (which uses TokenJWTClaims.default) can be used for generic GETs if needed,
# but for consistency, we can use proponent_creator_auth_header for all proponent actions in these tests.

# Helper function from test_staff_package, adapted for submissions
def _create_base_entities_for_package(session, account_scenario_val, project_scenario_val, package_scenario_val, proponent_auth_header_for_creation, client_fixture):
    """
    Helper function to create an Account, a Project, link them via AccountProject,
    and then create a package by a proponent.
    Returns the created package object.
    """
    account_data = account_scenario_val.value
    project_data = project_scenario_val.value
    project_data['proponent_id'] = account_data['proponent_id']

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
    session.commit()

    package_creation_payload = {
        "name": package_scenario_val.value["name"],
        "type_id": package_scenario_val.value["type_id"],
    }
    proponent_package_creation_url = f"/api/packages/account-projects/{account_project.id}"
    response = client_fixture.post(proponent_package_creation_url, json=package_creation_payload, headers=proponent_auth_header_for_creation)
    assert response.status_code == HTTPStatus.CREATED
    created_package_data = response.json
    
    package_model = PackageModel.query.get(created_package_data["id"])
    session.add(package_model)
    session.commit()
    return package_model

# New helper function for submission prerequisites
def _create_prerequisites_for_submission(session, proponent_auth_header_for_creation, client_fixture):
    """
    Creates Account, Project, AccountProject, Package, and an Item.
    Returns submission_item_id and package_id.
    """
    # 1. Create Package (which internally creates Account, Project, AccountProject)
    package_model = _create_base_entities_for_package(
        session,
        AccountScenario.account1,
        ProjectScenario.project1,
        PackageScenario.package1,
        proponent_auth_header_for_creation,
        client_fixture
    )
    package_id = package_model.id

    # 2. Create an Item associated with this Package
    # Item model fields: name, package_id, item_template_id, sort_order, created_by
    # Assuming a simple Item creation for now. item_template_id might need to exist.
    # 'created_by' can be a placeholder or extracted from the token if available/necessary.
    item_data = {
        "name": "Test Item for Submission",
        "package_id": package_id,
        "item_template_id": 1, # Assuming an item_template with ID 1 exists
        "sort_order": 1,
        "created_by": TokenJWTClaims.PROPONENT_CREATE_BASIC.value["sub"] # Use user 'sub' from token
    }
    item = ItemModel(**item_data)
    session.add(item)
    session.commit() # Commit to get item.id
    submission_item_id = item.id
    
    return submission_item_id, package_id


def test_create_submission(client, proponent_creator_auth_header, session):
    """Test creating a new submission for an item."""
    submission_item_id, _ = _create_prerequisites_for_submission(session, proponent_creator_auth_header, client)

    # Payload based on CreateSubmissionRequestSchema.
    # SubmissionScenario.default_submission.value provides a base.
    # Fields like 'id', 'active', 'deleted', 'status', 'major_version', 'minor_version', 'root_submission_id'
    # are typically set by the backend.
    # 'created_by' is also often inferred from the auth token.
    # 'type' and potentially 'submitted_form_id' or 'submitted_document_id' might be needed.
    # The endpoint is POST /items/{submission_item_id}
    # The resource file indicates it expects CreateSubmissionRequestSchema, which has:
    # type (SubmissionType), submitted_form_id (optional), submitted_document_id (optional)

    submission_payload = {
        "type": SubmissionType.FORM.value,
        # submitted_form_id/submitted_document_id can be omitted if not applicable for the type or if it's a new form/doc
    }

    url = SUBMISSION_ITEM_URL.format(submission_item_id=submission_item_id)
    response = client.post(url, json=submission_payload, headers=proponent_creator_auth_header)

    assert response.status_code == HTTPStatus.CREATED, f"Error: {response.text}"
    response_json = response.json

    # Verify response based on SubmissionSchema
    assert "id" in response_json
    assert response_json["type"] == submission_payload["type"]
    assert response_json["item_id"] == submission_item_id
    assert response_json["status"] == SubmissionStatus.PENDING.value # Default for new submissions
    assert response_json["active"] is True
    assert response_json["deleted"] is False
    assert response_json["major_version"] == 1
    assert response_json["minor_version"] == 1
    assert response_json["root_submission_id"] == response_json["id"] # Initially, it's its own root

    # Verify in DB
    created_submission = SubmissionModel.query.get(response_json["id"])
    assert created_submission is not None
    assert created_submission.type == SubmissionType.FORM
    assert created_submission.item_id == submission_item_id
    assert created_submission.status == SubmissionStatus.PENDING

    # Store for other tests (though creating fresh is better)
    # session.info_holder = {'submission_id': response_json["id"], 'submission_item_id': submission_item_id}
    # Re-creating entities per test is generally preferred.


def test_edit_submission_form(client, proponent_creator_auth_header, session):
    """Test editing an existing submission's form data."""
    # 1. Create a submission
    submission_item_id, _ = _create_prerequisites_for_submission(session, proponent_creator_auth_header, client)
    initial_submission_payload = {"type": SubmissionType.FORM.value}
    create_url = SUBMISSION_ITEM_URL.format(submission_item_id=submission_item_id)
    create_response = client.post(create_url, json=initial_submission_payload, headers=proponent_creator_auth_header)
    assert create_response.status_code == HTTPStatus.CREATED
    submission_id = create_response.json["id"]

    # 2. Edit the submission's form
    # The payload for PATCH /{submission_id}/form is SubmittedFormSchema.
    # This schema is not fully defined in the prompt, but typically includes form_data (json) and may include
    # submitted_form_id if it's linking to an existing form structure, or version, etc.
    # For a simple edit, we might be sending new form_data.
    # Let's assume it expects a 'form_data' field which is a JSON object.
    # And potentially 'version' if the API handles optimistic locking or versioning via payload.
    # The resource file shows `args = submitted_form_schema.load(request.json)`
    # `SubmittedFormSchema` would have fields like `form_data: dict`, `version: int`, `submitted_by: str`.
    # `version` might refer to the form's internal version, not the submission's version.
    # Let's assume a simple `form_data` update.

    edit_payload = {
        "form_data": {"field1": "new_value", "field2": 123},
        # 'version' might be required if the API implements optimistic concurrency control.
        # For now, assume it's not strictly required or a default is handled.
        # 'submitted_form_id' is likely for linking, not direct data update.
    }
    # According to `submit-api/src/submit_api/schemas/submitted_form.py`, `SubmittedFormSchema`
    # has `form_data`, `submitted_by`, `submitted_date`, `version`.
    # `version` here seems to be the data version of the form itself.
    # `submitted_by` and `submitted_date` are likely backend-set on initial submit.
    # For an update, we primarily send `form_data`.
    # The endpoint might also expect the current `version` of the submission if it's versioning.

    # Let's check the Submission model for how form data is stored.
    # Submission.submitted_form -> SubmittedForm relationship.
    # SubmittedForm has form_data = Column(JSONB, nullable=True)
    # So, we are essentially updating the associated SubmittedForm's form_data.

    # The PATCH endpoint likely creates a *new* version of the submission with the updated form data.
    # The resource file for PATCH /{submission_id}/form:
    # - submission.update_version()
    # - new_submitted_form = SubmittedFormModel.create_submitted_form(...)
    # - submission.submitted_form_id = new_submitted_form.id
    # - submission.save()
    # This implies the payload should be for the new SubmittedForm.
    # CreateSubmittedFormSchema has: form_data, version.

    edit_payload_for_new_submitted_form = {
        "form_data": {"field1": "edited_value", "field2": 456},
        "version": 2 # Assuming this is a version for the form data structure, not submission version.
    }

    url = SUBMISSION_FORM_URL.format(submission_id=submission_id)
    response = client.patch(url, json=edit_payload_for_new_submitted_form, headers=proponent_creator_auth_header)

    assert response.status_code == HTTPStatus.OK, f"Error: {response.text}"
    response_json = response.json # This should be SubmissionSchema

    # Verify the submission details reflect the update (e.g., new version)
    assert response_json["id"] == submission_id # Should be the same root submission ID
    # The edit should create a new version, so major_version or minor_version should increment.
    # Based on `submission.update_version()`, it's likely `minor_version` increments.
    assert response_json["minor_version"] > 1 or response_json["major_version"] > 1
    
    # Verify the form data itself. The response (SubmissionSchema) contains `submitted_form` (SubmittedFormSchema).
    assert "submitted_form" in response_json
    assert response_json["submitted_form"] is not None
    assert response_json["submitted_form"]["form_data"] == edit_payload_for_new_submitted_form["form_data"]
    # The ID of the submitted_form within the submission should change.
    assert response_json["submitted_form"]["id"] != create_response.json.get("submitted_form", {}).get("id")


    # Verify in DB
    updated_submission = SubmissionModel.query.get(submission_id) # This gets the root submission by its original ID
    session.refresh(updated_submission) # Refresh to get the latest state
    
    # The `updated_submission` object fetched by `submission_id` might still point to the original version's direct data
    # or it might be updated to reflect the latest version's pointers if the same record is updated.
    # Given `submission.update_version()` and `new_submitted_form`, it sounds like the Submission record itself
    # (with `submission_id`) gets its `minor_version` and `submitted_form_id` updated.

    assert updated_submission.minor_version > 1 or updated_submission.major_version > 1
    assert updated_submission.submitted_form is not None
    assert updated_submission.submitted_form.form_data == edit_payload_for_new_submitted_form["form_data"]


def test_get_submission_versions(client, proponent_creator_auth_header, session):
    """Test retrieving versions of a submission."""
    # 1. Create a submission
    submission_item_id, _ = _create_prerequisites_for_submission(session, proponent_creator_auth_header, client)
    initial_submission_payload = {"type": SubmissionType.FORM.value}
    create_url = SUBMISSION_ITEM_URL.format(submission_item_id=submission_item_id)
    create_response = client.post(create_url, json=initial_submission_payload, headers=proponent_creator_auth_header)
    assert create_response.status_code == HTTPStatus.CREATED
    submission_id = create_response.json["id"] # This is the root_submission_id

    # 2. (Optional) Edit the submission to create a new version
    edit_payload = {
        "form_data": {"field1": "version 2 data"},
        "version": 3 # Arbitrary form data version
    }
    edit_url = SUBMISSION_FORM_URL.format(submission_id=submission_id)
    edit_response = client.patch(edit_url, json=edit_payload, headers=proponent_creator_auth_header)
    assert edit_response.status_code == HTTPStatus.OK

    # 3. Retrieve versions
    # The endpoint is /api/submissions/{submission_id}/versions where submission_id is the root_submission_id
    url = SUBMISSION_VERSIONS_URL.format(submission_id=submission_id)
    response = client.get(url, headers=proponent_creator_auth_header)

    assert response.status_code == HTTPStatus.OK, f"Error: {response.text}"
    response_json = response.json
    assert isinstance(response_json, list)
    # We created an initial version and then edited it, creating a second version.
    # So, we expect at least two versions.
    assert len(response_json) >= 2

    # Verify that the versions are ordered (e.g., by major/minor version descending)
    # And that they contain the submission_id as their root_submission_id.
    # The Submission model's find_all_versions sorts by major_version.desc(), minor_version.desc()
    # So the first item in the list should be the latest version.
    latest_version_from_api = response_json[0]
    original_version_from_api = response_json[-1] # Last item should be the first version

    assert latest_version_from_api["root_submission_id"] == submission_id
    assert latest_version_from_api["minor_version"] > original_version_from_api["minor_version"] or \
           latest_version_from_api["major_version"] > original_version_from_api["major_version"]

    # Check if form data from the latest version matches the edit
    # The response items are SubmissionSchema, which contains submitted_form.
    if latest_version_from_api.get("submitted_form"):
        assert latest_version_from_api["submitted_form"]["form_data"] == edit_payload["form_data"]
    
    # Check original version details (e.g., its submitted_form might be None or have initial data)
    # The first version (create_response.json) might not have had a `submitted_form` if it was just a pending shell.
    # If it did, its form_data would be empty or default.
    # This part depends on what the initial POST to /items/{submission_item_id} actually creates for submitted_form.
    # `SubmissionModel.create` creates a submission, but `submitted_form_id` is optional.
    # The `create_submission` endpoint seems to create a submission, and if type is FORM, it also
    # creates a default SubmittedForm.
    # Let's check the initial response:
    initial_submitted_form = create_response.json.get("submitted_form")
    if initial_submitted_form:
         assert original_version_from_api.get("submitted_form", {}).get("id") == initial_submitted_form.get("id")
    else:
        # If initial submission didn't have a form, then original_version_from_api.submitted_form should be None
        assert original_version_from_api.get("submitted_form") is None


def test_replace_submission_document(client, proponent_creator_auth_header, session):
    """Test replacing an existing submission's document."""
    # 1. Create an initial submission of type DOCUMENT
    submission_item_id, _ = _create_prerequisites_for_submission(session, proponent_creator_auth_header, client)
    initial_submission_payload = {"type": SubmissionType.DOCUMENT.value}
    create_url = SUBMISSION_ITEM_URL.format(submission_item_id=submission_item_id)
    create_response = client.post(create_url, json=initial_submission_payload, headers=proponent_creator_auth_header)
    assert create_response.status_code == HTTPStatus.CREATED
    submission_id = create_response.json["id"]
    original_submitted_document_id = create_response.json.get("submitted_document", {}).get("id")


    # 2. Replace the document
    # Payload based on CreateSubmittedDocumentRequestSchema
    # (file_name, content_type, file_size, document_type_id)
    # Document types need to exist in the 'document_types' table. Assuming ID 1 exists.
    replace_payload = {
        "file_name": "new_document.pdf",
        "content_type": "application/pdf",
        "file_size": 2048, # in bytes
        "document_type_id": 1 # Assuming a valid document_type_id
    }

    url = SUBMISSION_DOCUMENT_URL.format(submission_id=submission_id)
    response = client.post(url, json=replace_payload, headers=proponent_creator_auth_header)

    assert response.status_code == HTTPStatus.CREATED, f"Error: {response.text}" # As per spec, POST returns 201
    response_json = response.json # This should be SubmissionSchema for the new version

    # Verify new version details
    assert response_json["id"] == submission_id # Root ID remains the same
    assert response_json["minor_version"] > 1 or response_json["major_version"] > 1
    assert response_json["type"] == SubmissionType.DOCUMENT.value

    # Verify the new document details
    assert "submitted_document" in response_json
    assert response_json["submitted_document"] is not None
    new_doc_details = response_json["submitted_document"]
    assert new_doc_details["file_name"] == replace_payload["file_name"]
    assert new_doc_details["content_type"] == replace_payload["content_type"]
    assert new_doc_details["size"] == replace_payload["file_size"] # Schema uses 'size'
    assert new_doc_details["document_type_id"] == replace_payload["document_type_id"]
    # The ID of the submitted_document should be new
    if original_submitted_document_id:
         assert new_doc_details["id"] != original_submitted_document_id
    else:
        assert new_doc_details["id"] is not None


    # Verify in DB
    updated_submission = SubmissionModel.query.get(submission_id)
    session.refresh(updated_submission)
    assert updated_submission.minor_version > 1 or updated_submission.major_version > 1
    assert updated_submission.submitted_document is not None
    assert updated_submission.submitted_document.file_name == replace_payload["file_name"]


def test_delete_submission_document(client, proponent_creator_auth_header, session):
    """Test deleting an existing submission's document."""
    # 1. Create an initial submission of type DOCUMENT
    submission_item_id, _ = _create_prerequisites_for_submission(session, proponent_creator_auth_header, client)
    initial_submission_payload = {"type": SubmissionType.DOCUMENT.value}
    # We also need to provide initial document details for it to be a "document submission"
    # that can be deleted. The POST /items/{id} endpoint creates a Submission.
    # If type is DOCUMENT, it also creates a SubmittedDocument.
    # The CreateSubmissionRequestSchema allows submitted_document_id.
    # However, the endpoint logic for POST /items/{id} seems to create a default SubmittedDocument if type is DOCUMENT.
    # Let's assume the create endpoint handles making a default document if type is DOCUMENT.
    
    create_url = SUBMISSION_ITEM_URL.format(submission_item_id=submission_item_id)
    create_response = client.post(create_url, json=initial_submission_payload, headers=proponent_creator_auth_header)
    assert create_response.status_code == HTTPStatus.CREATED
    submission_id = create_response.json["id"]
    
    # Ensure a document was actually associated
    assert create_response.json.get("submitted_document") is not None
    assert create_response.json.get("submitted_document_id") is not None


    # 2. Delete the document associated with the submission
    url = SUBMISSION_DOCUMENT_URL.format(submission_id=submission_id)
    response = client.delete(url, headers=proponent_creator_auth_header)

    assert response.status_code == HTTPStatus.OK, f"Error: {response.text}"
    # The response for DELETE is usually 204 No Content or 200 OK with a confirmation message.
    # The spec says it returns SubmissionSchema.
    response_json = response.json

    # Verify the submission is updated (e.g., marked as deleted, or document link removed, new version)
    # The resource file for DELETE /{submission_id}/document indicates:
    # - submission.update_version()
    # - submission.submitted_document_id = None
    # - submission.status = SubmissionStatus.PENDING_REPLACEMENT (or PENDING if no prior document)
    # - submission.save()
    # So, a new version is created, document is unlinked, and status changes.

    assert response_json["id"] == submission_id
    assert response_json["minor_version"] > 1 or response_json["major_version"] > 1 # New version
    assert response_json["submitted_document_id"] is None
    assert response_json["submitted_document"] is None
    assert response_json["status"] == SubmissionStatus.PENDING_REPLACEMENT.value # Or PENDING

    # Verify in DB
    updated_submission = SubmissionModel.query.get(submission_id)
    session.refresh(updated_submission)
    assert updated_submission.minor_version > 1 or updated_submission.major_version > 1
    assert updated_submission.submitted_document_id is None
    assert updated_submission.submitted_document is None
    assert updated_submission.status == SubmissionStatus.PENDING_REPLACEMENT # Check exact status based on logic
    
    # Further check: If we try to GET the specific submitted_document by its old ID, it should still exist,
    # but it's just unlinked from this submission version. The document itself is not deleted from SubmittedDocument table.
    # This part is optional as the main check is on the submission's state.
