"""Test for package management."""
from http import HTTPStatus

from faker import Faker

from tests.utilities.factory_scenarios import TestPackageScenarios
from tests.utilities.factory_utils import factory_package_model, setup_authenticated_proponent


fake = Faker()


def test_create_package_as_project_admin(client, session, jwt):
    """Test creating a package with a user having PROJECT_ADMIN role."""
    headers, account_project = setup_authenticated_proponent(session, jwt)

    management_plan = TestPackageScenarios.get_payload()
    response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=management_plan,
        headers=headers,
    )

    assert response.status_code == 201
    assert_package_response_valid(response.json, account_project.id, management_plan)

    # Fetch back with GET and verify
    package_id = response.json["id"]
    get_response = client.get(f"/api/packages/{package_id}", headers=headers)
    assert get_response.status_code == HTTPStatus.OK
    assert_package_response_valid(get_response.json, account_project.id, management_plan)


def test_create_package_with_iem_type(client, session, jwt):
    """Test creating a package with type 'IEM Notification'."""
    headers, account_project = setup_authenticated_proponent(session, jwt)

    iem_payload = TestPackageScenarios.get_payload(type_name="IEM")
    response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=iem_payload,
        headers=headers,
    )

    assert response.status_code == 201
    assert_package_response_valid(response.json, account_project.id, iem_payload)


def test_create_package_with_invalid_type(client, session, jwt):
    """Test creating a package with an invalid type name returns 400 Bad Request."""
    headers, account_project = setup_authenticated_proponent(session, jwt)

    invalid_payload = TestPackageScenarios.get_payload(type_name="Invalid Type")
    response = client.post(
        f"/api/packages/account-projects/{account_project.id}",
        json=invalid_payload,
        headers=headers,
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "type" in response.json["message"].lower()


def test_get_package_by_id_success(client, session, jwt):
    """Test getting a package by ID returns the correct data."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)

    response = client.get(f"/api/packages/{package.id}", headers=headers)

    assert response.status_code == HTTPStatus.OK
    assert response.json["id"] == package.id
    assert response.json["name"] == package.name
    assert response.json["account_project_id"] == account_project.id
    assert response.json["status"] == [s.value for s in package.status]


def assert_package_response_valid(response_json, account_project_id, expected_payload):
    """Assert key fields in the package creation response against the expected payload."""
    # Top-level fields
    assert response_json["name"] == expected_payload["name"]
    assert response_json["account_project_id"] == account_project_id
    assert response_json["status"] == ["NEW"]
    assert response_json["type"]["name"] == expected_payload["type"]

    # Main condition metadata (response uses 'meta', payload uses 'metadata')
    expected_main_condition = expected_payload["metadata"]["main_condition"]
    actual_main_condition = response_json["meta"]["main_condition"]

    assert actual_main_condition["condition_name"] == expected_main_condition["condition_name"]
    assert actual_main_condition["condition_number"] == expected_main_condition["condition_number"]
    assert actual_main_condition["plan_name"] == expected_main_condition["plan_name"]

    # Condition attributes
    expected_attrs = expected_main_condition["condition_attributes"]
    actual_attrs = actual_main_condition["condition_attributes"]

    assert actual_attrs["deliverable_name"] == expected_attrs["deliverable_name"]
    assert set(expected_attrs["parties_required_to_be_consulted"]).issubset(
        set(actual_attrs["parties_required_to_be_consulted"])
    )

    # Items check (if items are included in payload)
    if "items" in expected_payload:
        expected_item_types = {item["type"]["name"] for item in expected_payload["items"]}
        actual_item_types = {item["type"]["name"] for item in response_json["items"]}
        assert expected_item_types.issubset(actual_item_types)

    assert all(isinstance(item["sort_order"], int) for item in response_json["items"])
