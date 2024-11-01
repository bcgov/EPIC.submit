"""Various test data for project."""
from enum import Enum

from faker import Faker

from submit_api.models import Project as ProjectModel

from ..factory_utils import generate_abbreviation


fake = Faker()


class ProjectScenario(Enum):
    """project scenario."""

    default_project = {"name": fake.name(), "abbreviation": generate_abbreviation(4)}

    project1 = {"name": fake.name(), "abbreviation": generate_abbreviation(4)}

    project2 = {"name": fake.name(), "abbreviation": generate_abbreviation(4)}

    @staticmethod
    def create(project_data: dict):
        """Create project."""
        project = ProjectModel(**project_data)
        project.save()
        print("save completed")
        return project
