"""Module for defining various project scenarios for testing with realistic data."""
from enum import Enum

from faker import Faker

from src.submit_api.models import Project as ProjectModel
from src.submit_api.models import db
from src.submit_api.models.proponent import Proponent

fake = Faker()


class ProjectScenario(Enum):
    """Project scenarios for testing with realistic data according to the model."""

    default_project = {
        "name": fake.name(),
        "proponent_id": fake.random_int(1),
        "ea_certificate": fake.uuid4()
    }

    project1 = {
        "name": fake.name(),
        "proponent_id": 1,
        "ea_certificate": fake.uuid4()
    }

    project2 = {
        "name": fake.name(),
        "proponent_id": 1,
        "ea_certificate": fake.uuid4()
    }

    @staticmethod
    def create(project_data: dict):
        """Create and save a Project instance."""
        proponent_id = project_data.get("proponent_id")
        if proponent_id:
            existing_proponent = Proponent.query.filter_by(id=proponent_id).first()
            if not existing_proponent:
                proponent = Proponent(
                    id=proponent_id,
                    name=f"Test Proponent {proponent_id}",
                    is_deleted=False
                )
                db.session.add(proponent)
                db.session.flush()

        project = ProjectModel(**project_data)
        project.save()
        print("Save completed")
        return project
