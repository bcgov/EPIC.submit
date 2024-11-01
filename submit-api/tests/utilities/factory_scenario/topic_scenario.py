"""Various test data for topics."""
from enum import Enum

from faker import Faker

from compliance_api.models import Topic as TopicModel


fake = Faker()


class TopicScenario(Enum):
    """Topic scenario."""

    default_topic = {"name": fake.word()}

    topic1 = {"name": fake.word()}

    topic2 = {"name": fake.word()}

    @staticmethod
    def create(topic_data: dict) -> TopicModel:
        """Create topic."""
        topic = TopicModel(**topic_data)
        topic.save()
        print("save completed")
        return topic
