"""Scenario for case file."""

from enum import Enum

from faker import Faker


fake = Faker()


class CasefileScenario(Enum):
    """Case file scenario."""

    default_value = {
        "project_id": 1,
        "date_created": "2024-09-17T00:00:00.123Z",
        "initiation_id": 2,
    }
