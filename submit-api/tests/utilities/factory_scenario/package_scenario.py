"""Module for defining various package scenarios for testing with realistic data."""
from enum import Enum

from faker import Faker

from src.submit_api.models import Package as PackageModel
from src.submit_api.models.package import PackageStatus

fake = Faker()


class PackageScenario(Enum):
    """Package scenarios for testing with realistic data according to the model."""

    default_package = {
        "account_project_id": fake.random_int(1),
        "name": fake.name(),
        "type_id": fake.random_int(1),
        "status": [PackageStatus.NEW_SUBMISSION.value],
        "active": True,
    }

    package1 = {
        "account_project_id": 1,
        "name": fake.name(),
        "type_id": 1,
        "status": [PackageStatus.IN_REVIEW.value],
        "active": True,
    }

    package2 = {
        "account_project_id": 2,
        "name": fake.name(),
        "type_id": 2,
        "status": [PackageStatus.APPROVED.value],
        "active": False,
    }

    @staticmethod
    def create(package_data: dict):
        """Create and save a Package instance."""
        package = PackageModel(**package_data)
        package.save()
        return package
