"""Service for submission management."""
from typing import Protocol

from submit_api.models import SubmittedDocument as SubmittedDocumentModel, Package as PackageModel
from submit_api.models.db import session_scope
from submit_api.models.submission import Submission as SubmissionModel
from submit_api.models.submission import SubmissionTypeStatus
from submit_api.models.submitted_form import SubmittedForm as SubmittedFormModel


class SubmissionCreatorFactory(Protocol):
    """Submission creator factory protocol."""

    def create(self, item_id, request_data) -> SubmissionModel:
        """Create a new submission."""
        return SubmissionModel()


class FormSubmissionCreator(SubmissionCreatorFactory):
    """Form submission creator."""

    def create(self, item_id, request_data):
        """Create a new form submission."""
        with session_scope() as session:
            submitted_form = self._create_submitted_form(session, request_data)
            submission = self._create_submission(session, item_id, submitted_form.id)
            return submission

    @staticmethod
    def _create_submitted_form(session, request_data):
        """Create a new submitted form."""
        submitted_form = SubmittedFormModel(
            submission_json=request_data
        )
        session.add(submitted_form)
        session.commit()
        session.flush()
        return submitted_form

    @staticmethod
    def _create_submission(session, item_id, submitted_form_id):
        """Create a new submission."""
        previous_submission = SubmissionModel.find_latest_by_type_and_item_id(
            item_id, SubmissionTypeStatus.FORM.value)
        if previous_submission:
            raise ValueError("Form submission already created.")

        submission = SubmissionModel(
            item_id=item_id,
            type=SubmissionTypeStatus.FORM.value,
            submitted_form_id=submitted_form_id,
        )
        session.add(submission)
        session.commit()
        session.flush()
        return submission


class DocumentSubmissionCreator(SubmissionCreatorFactory):
    """Document submission creator."""

    def create(self, item_id, request_data):
        """Create a new document submission."""
        with session_scope() as session:
            submitted_document = self._create_submitted_document(session, request_data)
            submission = self._create_submission(session, item_id, submitted_document.id)
            return submission

    @classmethod
    def get_document_version(cls, item_id, original_submission_id=None):
        """Get the latest document version."""
        submission_item = SubmissionModel.find_by_id(item_id)
        submission_package = PackageModel.find_by_id(submission_item.package_id)
        major_version = submission_package.version

        if not original_submission_id or not submission_package.submitted_on:
            minor_version = 1
            return major_version, minor_version

        original_submission = SubmissionModel.find_by_id(original_submission_id)
        minor_version = original_submission.minor_version + 1

        return major_version, minor_version

    @staticmethod
    def _create_submitted_document(session, request_data):
        """Create a new submitted document."""
        submitted_document = SubmittedDocumentModel(
            name=request_data.get('name'),
            url=request_data.get('url'),
            folder=request_data.get('folder')
        )
        session.add(submitted_document)
        session.commit()
        session.flush()
        return submitted_document

    @staticmethod
    def _create_submission(session, item_id, submitted_document_id):
        """Create a new submission."""
        major_version, minor_version = DocumentSubmissionCreator.get_document_version(item_id)
        submission = SubmissionModel(
            item_id=item_id,
            type=SubmissionTypeStatus.DOCUMENT,
            submitted_document_id=submitted_document_id,
            major_version=major_version,
            minor_version=minor_version
        )
        session.add(submission)
        session.commit()
        session.flush()
        return submission
