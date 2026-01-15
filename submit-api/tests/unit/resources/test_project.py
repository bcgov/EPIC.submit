"""Test Project.

Test for project.
"""
import copy
from http import HTTPStatus

from faker import Faker

from submit_api import get_named_config
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model, factory_account_project_model, factory_auth_header, factory_project_model,
    factory_proponent_model, factory_user_model)

fake = Faker()


CONFIG = get_named_config("testing")


def test_get_project_by_id(client, session, jwt):
    """Test get project by id"""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    factory_user_model(auth_guid=auth_guid)

    proponent_name = "Test Proponent Name"
    proponent_id = fake.random_int(min=1000, max=9999)
    factory_proponent_model(id=proponent_id, name=proponent_name, is_deleted=False)
    
    account = factory_account_model(proponent_id=proponent_id)
    project = factory_project_model(name="TestProject", proponent_id=proponent_id)
    account_project = factory_account_project_model(account_id=account.id, project_id=project.id)

    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.get(
        f"/api/staff/projects/{account_project.id}",
        headers=headers
    )

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    
    assert data["id"] == account_project.id
    assert data["project"]["name"] == "TestProject"
    
    assert "proponent" in data["project"]
    assert data["project"]["proponent"] is not None
    assert data["project"]["proponent"]["name"] == proponent_name


def test_get_project_by_id_no_roles(client, session, jwt):
    """Test project access with valid JWT but no roles."""
    claims = copy.deepcopy(TestJwtClaims.staff_admin_role.value)
    claims["realm_access"]["roles"] = []
    claims["resource_access"][CONFIG.JWT_OIDC_TEST_AUDIENCE]["roles"] = []

    auth_guid = claims['sub']
    factory_user_model(auth_guid=auth_guid)

    account = factory_account_model()
    project = factory_project_model(name="TestProjectNoRoles", proponent_id=111222)
    account_project = factory_account_project_model(account_id=account.id, project_id=project.id)

    session.flush()
    headers = factory_auth_header(jwt=jwt, claims=claims)

    response = client.get(f"/api/staff/projects/{account_project.id}", headers=headers)

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_get_project_by_id_invalid_jwt(client):
    """Test project access with invalid JWT token."""
    invalid_token = "Bearer this.is.not.valid"

    response = client.get(
        "/api/staff/projects/1",
        headers={"Authorization": invalid_token}
    )

    assert response.status_code == HTTPStatus.UNAUTHORIZED