"""Test suit for topic."""
import json
from http import HTTPStatus
from urllib.parse import urljoin

from compliance_api.models.topic import Topic as TopicModel
from tests.utilities.factory_scenario import TopicScenario


API_BASE_URL = "/api/"


def test_get_topics(app, client, auth_header):
    """Get topics."""
    url = urljoin(API_BASE_URL, "topics")
    topics_in_db = TopicModel.get_all()
    # Create topics
    TopicScenario.create(TopicScenario.topic1.value)
    TopicScenario.create(TopicScenario.topic2.value)
    result = client.get(url, headers=auth_header)
    assert len(result.json) == len(topics_in_db) + 2
    assert result.status_code == HTTPStatus.OK


def test_get_specific_topic(app, client, auth_header):
    """Get topic by id."""
    # Create a topic
    created_topic = TopicScenario.create(TopicScenario.topic1.value)
    url = urljoin(API_BASE_URL, f"topics/{created_topic.id}")
    result = client.get(url, headers=auth_header)
    assert result.status_code == HTTPStatus.OK
    assert result.json["id"] == created_topic.id
    assert result.json["name"] == created_topic.name


def test_create_topic(client, auth_header):
    """Create topic."""
    url = urljoin(API_BASE_URL, "topics")
    result = client.post(
        url, data=json.dumps(TopicScenario.default_topic.value), headers=auth_header
    )
    assert result.json["name"] == TopicScenario.default_topic.value["name"]
    assert result.status_code == HTTPStatus.CREATED


def test_create_topic_with_mandatory_missing(client, auth_header):
    """Create topic with missing mandatory field."""
    url = urljoin(API_BASE_URL, "topics")
    create_dict = TopicScenario.default_topic.value
    create_dict.pop("name")
    result = client.post(url, data=json.dumps(create_dict), headers=auth_header)
    response = json.loads(result.json["message"])
    assert "name" in response
    assert result.status_code == HTTPStatus.BAD_REQUEST


def test_update_topic(client, auth_header):
    """Update topic."""
    topic = TopicScenario.create(TopicScenario.topic1.value)
    url = urljoin(API_BASE_URL, f"topics/{topic.id}")
    update_dict = TopicScenario.topic1.value
    update_dict["name"] = "changed"
    result = client.patch(url, data=json.dumps(update_dict), headers=auth_header)
    assert result.json["name"] == update_dict["name"]
    assert result.status_code == HTTPStatus.OK


def test_delete_topic(client, auth_header):
    """Delete topic."""
    topic = TopicScenario.create(TopicScenario.topic1.value)
    url = urljoin(API_BASE_URL, f"topics/{topic.id}")
    result = client.delete(url, headers=auth_header)
    assert result.status_code == HTTPStatus.OK
    topic_get = TopicModel.find_by_id(topic.id)
    assert topic_get is None
