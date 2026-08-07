"""Submission tests."""
from http import HTTPStatus

from tests.utilities.factory_scenarios import TestPackageScenarios
from tests.utilities.factory_utils import setup_authenticated_proponent


def test_submit_contact_information_form(client, session, jwt):
    """Submit CI test"""
    # Step 1: Authenticate as proponent and create a package
    headers, account_project = setup_authenticated_proponent(session, jwt)
    payload = TestPackageScenarios.get_payload()

    package_response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=payload,
        headers=headers,
    )
    assert package_response.status_code == HTTPStatus.CREATED
    package_data = package_response.json

    # Step 2: Get Contact Information Form item (type_id = 1)
    contact_item = next(
        (item for item in package_data.get("items", []) if item.get("type_id") == 1),
        None,
    )
    assert contact_item, "Contact Information Form not found in package"
    item_id = contact_item["id"]

    # Step 3: Prepare form submission payload
    form_payload = TestPackageScenarios.get_contact_info_submission_payload(item_id)

    # Step 4: Submit the form
    submission_response = client.post(
        f"/api/submissions/items/{item_id}",
        json=form_payload,
        headers=headers,
    )
    assert submission_response.status_code == HTTPStatus.CREATED

    data = submission_response.json

    # Step 5: Validate the response using submitted payload
    submitted = data["submitted_form"]["submission_json"]

    assert data["item_id"] == item_id
    assert data["status"] == "PENDING"
    assert data["type"] == "SubmissionType.FORM"
    assert data["submitted_form"]
    assert data["submitted_form_id"] == data["submitted_form"]["id"]
    assert submitted["primaryContact"]["company"] == form_payload["data"]["primaryContact"]["company"]
    assert data["version"] == "1.1"


def test_submit_cr_and_mp_document(client, session, jwt):
    """Test CR and MP submissions."""
    # Step 1: Authenticate as proponent and create a package
    headers, account_project = setup_authenticated_proponent(session, jwt)
    payload = TestPackageScenarios.get_payload()

    package_response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=payload,
        headers=headers,
    )
    assert package_response.status_code == HTTPStatus.CREATED
    package_data = package_response.json

    # Step 2: Get Consultation Record(s) item (type_id = 2)
    consultation_item = next(
        (item for item in package_data.get("items", []) if item.get("type_id") == 2),
        None,
    )
    assert consultation_item, "Consultation Record(s) item not found in package"
    assert consultation_item["package_id"] == package_data["id"]
    assert consultation_item["sort_order"] == 1
    assert consultation_item["status"] == ""
    assert consultation_item["submissions"] == []
    assert consultation_item["type"]["submission_method"] == "DOCUMENT_UPLOAD"

    management_plan_item = next(
        (item for item in package_data.get("items", []) if item.get("type_id") == 3),
        None,
    )
    assert management_plan_item, "Management Plan item not found in package"
    assert management_plan_item["type"]["submission_method"] == "DOCUMENT_UPLOAD"


def test_submit_management_plan_document(client, session, jwt):
    """Test MP document."""
    # Step 1: Authenticate and create a package
    headers, account_project = setup_authenticated_proponent(session, jwt)
    payload = TestPackageScenarios.get_payload()

    package_response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=payload,
        headers=headers,
    )
    assert package_response.status_code == HTTPStatus.CREATED
    package_data = package_response.json

    # Step 2: Find the Management Plan item
    management_plan_item = next(
        (item for item in package_data.get("items", []) if item.get("type_id") == 3),
        None,
    )
    assert management_plan_item, "Management Plan item not found in package"
    assert management_plan_item["type"]["submission_method"] == "DOCUMENT_UPLOAD"
    item_id = management_plan_item["id"]

    doc_payload = TestPackageScenarios.get_fake_document_payload()

    # Step 4: Submit the document
    submission_response = client.post(
        f"/api/submissions/items/{item_id}",
        json=doc_payload,
        headers=headers
    )

    assert submission_response.status_code == HTTPStatus.CREATED
    data = submission_response.json

    # Step 5: Validate response
    assert data["item_id"] == item_id
    assert data["status"] == "PENDING"
    assert data["type"] == "SubmissionType.DOCUMENT"
    assert data["submitted_by"]
    assert data["submitted_document"]
    assert data["submitted_document_id"] == data["submitted_document"]["id"]
    assert data["submitted_document"]["url"] == doc_payload["data"]["url"]
    assert data["submitted_document"]["folder"] == doc_payload["data"]["folder"]
    assert data["submitted_document"]["name"]  # Just verify it's set
    assert data["version"] == "1.1"


def test_submit_package_state(client, session, jwt):
    """Full test for submitting package state after all 3 items are filled."""
    # Step 1: Setup proponent and create package
    headers, account_project = setup_authenticated_proponent(session, jwt)
    payload = TestPackageScenarios.get_payload()
    package_response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=payload,
        headers=headers,
    )
    assert package_response.status_code == HTTPStatus.CREATED
    package_data = package_response.json
    package_id = package_data["id"]

    # Step 2: Get individual items
    contact_item = next(item for item in package_data["items"] if item["type_id"] == 1)
    consultation_item = next(item for item in package_data["items"] if item["type_id"] == 2)
    management_item = next(item for item in package_data["items"] if item["type_id"] == 3)

    # Step 3: Submit Contact Information Form
    contact_payload = TestPackageScenarios.get_contact_info_submission_payload(contact_item["id"])
    contact_response = client.post(
        f"/api/submissions/items/{contact_item['id']}",
        json=contact_payload,
        headers=headers,
    )
    assert contact_response.status_code == HTTPStatus.CREATED

    # Step 3.5: Upload Consultation Record Document (required before marking as COMPLETED)
    consultation_doc_payload = TestPackageScenarios.get_fake_document_payload()
    consultation_doc_response = client.post(
        f"/api/submissions/items/{consultation_item['id']}",
        json=consultation_doc_payload,
        headers=headers,
    )
    assert consultation_doc_response.status_code == HTTPStatus.CREATED

    # Step 4: Submit Consultation Record Form with COMPLETED status
    consultation_payload = TestPackageScenarios.get_consultation_record_form_payload(consultation_item["id"])
    consultation_payload["status"] = "COMPLETED"
    consultation_payload["version"] = "1.1"
    consultation_payload["data"] = consultation_payload.pop("submission_json")

    consultation_response = client.post(
        f"/api/submissions/items/{consultation_item['id']}",
        json=consultation_payload,
        headers=headers,
    )
    assert consultation_response.status_code == HTTPStatus.CREATED

    # Step 4.5: Upload Management Plan Document (required before marking as COMPLETED)
    management_doc_payload = TestPackageScenarios.get_fake_document_payload()
    management_doc_response = client.post(
        f"/api/submissions/items/{management_item['id']}",
        json=management_doc_payload,
        headers=headers,
    )
    assert management_doc_response.status_code == HTTPStatus.CREATED

    # Step 5: Submit Management Plan Form with COMPLETED status
    management_payload = TestPackageScenarios.get_management_plan_form_payload(management_item["id"])
    management_payload["status"] = "COMPLETED"
    management_payload["version"] = "1.1"
    management_payload["data"] = management_payload.pop("submission_json")

    management_response = client.post(
        f"/api/submissions/items/{management_item['id']}",
        json=management_payload,
        headers=headers,
    )
    assert management_response.status_code == HTTPStatus.CREATED

    # Step 6: Mark package as submitted
    state_response = client.post(
        f"/api/packages/{package_id}/state",
        json={"status": "SUBMITTED"},
        headers=headers,
    )
    assert state_response.status_code == HTTPStatus.OK

    data = state_response.json

    # Step 7: Basic assertions
    assert data["id"] == package_id
    assert data["status"] == ["SUBMITTED"]
    assert data["submitted_by"]
    assert data["submitted_on"]
    for item in data["items"]:
        assert item["status"] == "SUBMITTED"
        assert len(item["submissions"]) >= 1

        # Step 8: Get the full package and verify structure
        get_response = client.get(f"/api/packages/{package_id}", headers=headers)
        assert get_response.status_code == HTTPStatus.OK

        package_json = get_response.json
        assert package_json["id"] == package_id
        assert package_json["status"] == ["SUBMITTED"]
        assert package_json["submitted_on"]

        # Meta and condition checks
        assert "meta" in package_json
        assert "main_condition" in package_json["meta"]
        assert "plan_name" in package_json["meta"]["main_condition"]
        assert package_json["meta"]["main_condition"]["plan_name"]

        # Check each item and its submissions
        for item in package_json["items"]:
            assert item["status"] == "SUBMITTED"
            assert item["type_id"] in [1, 2, 3]
            assert len(item["submissions"]) >= 1
            for submission in item["submissions"]:
                assert submission["status"] == "SUBMITTED"
                assert submission["type"] in ("FORM", "DOCUMENT")
                if submission["type"] == "FORM":
                    assert submission["submitted_form"]
                    assert "submission_json" in submission["submitted_form"]
                elif submission["type"] == "DOCUMENT":
                    assert submission["submitted_document"]
                    assert "url" in submission["submitted_document"]


def test_acknowledge_rejected_for_review_based_package(client, session, jwt):
    """ACKNOWLEDGED must be rejected for package types without an approval workflow.

    Management Plan packages follow the review-based ladder (no approval_type), so
    acknowledging them via the state endpoint would incorrectly overwrite every
    item status. The endpoint must reject the verb with a 400.
    """
    # Setup proponent and create a Management Plan package (type_id 1, no approval_type)
    headers, account_project = setup_authenticated_proponent(session, jwt)
    payload = TestPackageScenarios.get_payload()
    package_response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=payload,
        headers=headers,
    )
    assert package_response.status_code == HTTPStatus.CREATED
    package_id = package_response.json["id"]

    # Attempt to acknowledge the Management Plan package. The guard fires before
    # any item mutation, so no item statuses are overwritten.
    state_response = client.post(
        f"/api/packages/{package_id}/state",
        json={"status": "ACKNOWLEDGED"},
        headers=headers,
    )
    assert state_response.status_code == HTTPStatus.BAD_REQUEST
    assert "does not support acknowledgement" in state_response.json["message"]
