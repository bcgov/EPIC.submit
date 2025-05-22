"""Module for defining various submission scenarios for testing with realistic data."""
from enum import Enum

from faker import Faker

from src.submit_api.models import Submission as SubmissionModel
from src.submit_api.models.submission import SubmissionType, SubmissionStatus

fake = Faker()


class SubmissionScenario(Enum):
    """Submission scenarios for testing with realistic data according to the model."""

    default_submission = {
        "item_id": fake.random_int(1),
        "type": SubmissionType.FORM.value,
        "created_by": fake.uuid4(),
        "status": SubmissionStatus.PENDING.value,
        "active": True,
        "deleted": False,
    }

    submission1 = {
        "item_id": 1,
        "type": SubmissionType.DOCUMENT.value,
        "created_by": fake.uuid4(),
        "status": SubmissionStatus.SUBMITTED.value,
        "active": True,
        "deleted": False,
    }

    submission2 = {
        "item_id": 2,
        "type": SubmissionType.BUSINESS_DATA.value,
        "created_by": fake.uuid4(),
        "status": SubmissionStatus.APPROVED.value,
        "active": False,
        "deleted": True,
    }

    @staticmethod
    def create(submission_data: dict):
        """Create and save a Submission instance."""
        submission = SubmissionModel(**submission_data)
        submission.save()
        return submission
