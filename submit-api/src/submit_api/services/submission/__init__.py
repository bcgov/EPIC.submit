"""Service for submission management."""
from submit_api.models import Item as ItemModel
from submit_api.models.db import session_scope
from submit_api.models.submission import Submission as SubmissionModel
from submit_api.models.submission import SubmissionType
from submit_api.services import authorization
from submit_api.services.item import ItemService
from submit_api.services.submission.submission_creator_factory import (
    DocumentSubmissionCreator, FormSubmissionCreator, SubmissionCreatorFactory)


class SubmissionService:
    """Submission management service."""

    @classmethod
    def make_submission_creator(cls, submission_type) -> SubmissionCreatorFactory:
        """Make a new submission creator."""
        submission_creators = {
            SubmissionType.FORM.value: FormSubmissionCreator(),
            SubmissionType.DOCUMENT.value: DocumentSubmissionCreator()
        }
        submission_creator = submission_creators.get(submission_type)
        if not submission_creator:
            raise ValueError(f"Submission type {submission_type} is not supported.")
        return submission_creator

    @classmethod
    def get_submission_by_id(cls, submission_id):
        """Get submission by id."""
        submission = SubmissionModel.find_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found.")
        return submission

    @classmethod
    def create_submission(cls, item_id, request_data):
        """Create a new submission."""
        cls._check_assigned_on_package(item_id)
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
        submission = cls.get_submission_by_id(submission_id)
        cls._check_assigned_on_package(submission.item_id)
        submission_type = request_data.get("type")
        submission_creator = cls.make_submission_creator(submission_type)
        submission_data = request_data.get("data")
        submission = submission_creator.replace(submission_id, submission_data)
        return submission
    
    @classmethod
    def move_submission(cls, submission_id, request_data):
        """Move an existing submission document."""
        submission = cls.get_submission_by_id(submission_id)
        cls._check_assigned_on_package(submission.item_id)
        submission_type = request_data.get("type")
        submission_creator = cls.make_submission_creator(submission_type)
        submission_data = request_data.get("data")
        return submission_creator.move(submission_id, submission_data)

    @classmethod
    def get_submission_by_id_and_validate_edit(cls, submission_id):
        """Get submission by id."""
        submission = cls.get_submission_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found.")
        if submission.type != SubmissionType.FORM:
            raise ValueError("Submission type is not supported.")

        if not submission.submitted_form:
            raise ValueError("Submission form not found.")
        return submission

    @classmethod
    def edit_submission_form(cls, submission_id, request):
        """Edit a submission form."""
        with session_scope() as session:
            submission = cls.get_submission_by_id_and_validate_edit(submission_id)
            cls._check_assigned_on_package(submission.item_id)
            submission.submitted_form.submission_json = request.get('data')
            session.add(submission.submitted_form)

            status = request.get("status")
            item_id = submission.item_id
            SubmissionService.update_submission_item_status(item_id, status, session)
            return submission

    @classmethod
    def update_submission_item_status(cls, item_id, status, session):
        """Update the status of the submission item."""
        if not status:
            return
        ItemService.update_submission_item_status(item_id, status, session)

    @classmethod
    def delete_submission(cls, submission_id):
        """Delete a submission."""
        submission = SubmissionModel.find_by_id(submission_id)
        cls._check_assigned_on_package(submission.item_id)
        if not submission:
            raise ValueError("Submission not found.")
        submission.delete()
        return submission

    @classmethod
    def get_all_versions(cls, submission_id):
        """Fetch all versions of a submission by its root submission ID."""
        with session_scope():
            submission: SubmissionModel = SubmissionModel.find_by_id(submission_id)
            if not submission:
                return None

            root_submission_id = submission.root_submission_id or submission.id
            return SubmissionModel.find_all_versions(root_submission_id)

    @classmethod
    def _check_assigned_on_package(cls, item_id):
        """Check if the item is assigned on the package."""
        item = ItemModel.find_by_id(item_id)
        if not item:
            raise ValueError("Item not found.")
        authorization.check_assigned_on_package(item.package_id)
