"""Service for submission management."""

from submit_api.models.db import session_scope
from submit_api.models.submission import Submission as SubmissionModel
from submit_api.models.submission import SubmissionTypeStatus
from submit_api.services.item import ItemService
from submit_api.services.submission.submission_creator_factory import (
    DocumentSubmissionCreator, FormSubmissionCreator, SubmissionCreatorFactory)


class SubmissionService:
    """Submission management service."""

    @classmethod
    def make_submission_creator(cls, submission_type) -> SubmissionCreatorFactory:
        """Make a new submission creator."""
        submission_creators = {
            SubmissionTypeStatus.FORM.value: FormSubmissionCreator(),
            SubmissionTypeStatus.DOCUMENT.value: DocumentSubmissionCreator()
        }
        submission_creator = submission_creators.get(submission_type)
        if not submission_creator:
            raise ValueError(f"Submission type {submission_type} is not supported.")
        return submission_creator

    @classmethod
    def get_submission_by_id(cls, submission_id):
        """Get submission by id."""
        submission = SubmissionModel.find_by_id(submission_id)
        return submission

    @classmethod
    def create_submission(cls, item_id, request_data):
        """Create a new submission."""
        with session_scope() as session:
            submission_type = request_data.get("type")
            submission_creator = cls.make_submission_creator(submission_type)

            submission_data = request_data.get("data")
            submission = submission_creator.create(item_id, submission_data, session)

            status = request_data.get("status")
            cls.update_submission_item_status(item_id, status, session)
            return submission

    @classmethod
    def replace_submission(cls, submission_id, request_data):
        """Create a new submission."""
        submission_type = request_data.get("type")
        submission_creator = cls.make_submission_creator(submission_type)
        submission_data = request_data.get("data")
        submission = submission_creator.replace(submission_id, submission_data)
        return submission

    @classmethod
    def get_submission_by_id_and_validate_edit(cls, submission_id):
        """Get submission by id."""
        submission = cls.get_submission_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found.")
        if submission.type != SubmissionTypeStatus.FORM:
            raise ValueError("Submission type is not supported.")

        if not submission.submitted_form:
            raise ValueError("Submission form not found.")
        return submission

    @classmethod
    def edit_submission_form(cls, submission_id, request):
        """Edit a submission form."""
        submission = cls.get_submission_by_id_and_validate_edit(submission_id)
        submission.submitted_form.submission_json = request.get('data')
        submission.submitted_form.save()
        return submission

    @classmethod
    def update_submission_item_status(cls, item_id, status, session):
        """Update the status of the submission item."""
        if not status:
            return
        ItemService.update_submission_item_status(item_id, status, session)
