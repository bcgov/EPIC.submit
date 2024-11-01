"""test suit for complaint."""
from http import HTTPStatus
from urllib.parse import urljoin


API_BASE_URL = "/api/"


def test_get_complaint_sources(client, auth_header):
    """Get complaint sources."""
    url = urljoin(API_BASE_URL, "complaints/sources")
    print(url)
    result = client.get(url, headers=auth_header)
    assert len(result.json) == 4
    assert result.status_code == HTTPStatus.OK
