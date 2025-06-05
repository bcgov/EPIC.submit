"""Test Project.

Test for project.
"""
from http import HTTPStatus

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_project_model,
    factory_account_model,
    factory_account_project_model,
    factory_auth_header, factory_user_model
)


def test_get_project_by_id(client, session, jwt):
    """Test get project by id."""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    factory_user_model(auth_guid=auth_guid)

    # Setup account, project, and account-project link
    account = factory_account_model()
    project = factory_project_model(name="TestProject", proponent_id=123456)
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
