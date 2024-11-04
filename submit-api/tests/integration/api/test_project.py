"""test suit for agency."""
from http import HTTPStatus
from urllib.parse import urljoin

from tests.utilities.factory_scenario import ProjectScenario


API_BASE_URL = "/api/"


def test_get_projects(app, client, auth_header):
    """Get Projects."""
    url = urljoin(API_BASE_URL, "projects/proponents/1")
    #  create projects
    ProjectScenario.create(ProjectScenario.project1.value)
    ProjectScenario.create(ProjectScenario.project2.value)
    result = client.get(url, headers=auth_header)
    assert len(result.json) == 1
    assert result.status_code == HTTPStatus.OK
