"""Integration tests for the project endpoints."""
from http import HTTPStatus

from faker import Faker

from tests.utilities.factory_utils import factory_project_model


API_BASE_URL = "/api/"
fake = Faker()


def test_get_projects(session, client, auth_header):
    """Projects belonging to a proponent are returned."""
    proponent_id = fake.random_int(min=100000, max=999999)
    factory_project_model(name="Integration A", proponent_id=proponent_id)
    factory_project_model(name="Integration B", proponent_id=proponent_id)
    result = client.get(f"{API_BASE_URL}projects/proponents/{proponent_id}", headers=auth_header)
    assert result.status_code == HTTPStatus.OK
    assert len(result.json) == 2
