from enum import Enum
from faker import Faker
from src.submit_api.models import Project as ProjectModel

fake = Faker()

class ProjectScenario(Enum):
    """Project scenarios for testing with realistic data according to the model."""

    default_project = {
        "name": fake.name(),
        "proponent_id": fake.random_int(1),
        "proponent_name": fake.name(),
        "ea_certificate": fake.uuid4()
    }

    project1 = {
        "name": fake.name(),
        "proponent_id": 1,
        "proponent_name": fake.name(),
        "ea_certificate": fake.uuid4()
    }

    project2 = {
        "name": fake.name(),
        "proponent_id": 1,
        "proponent_name": fake.name(),
        "ea_certificate": fake.uuid4()
    }

    @staticmethod
    def create(project_data: dict):
        """Create and save a Project instance."""
        project = ProjectModel(**project_data)
        project.save()
        print("Save completed")
        return project
