"""Service for submission management."""
from typing import Protocol

from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import Item as ItemModel
from submit_api.models import Package as PackageModel
from submit_api.models import SubmittedDocument as SubmittedDocumentModel
from submit_api.models.db import session_scope
from submit_api.models.submission import Submission as SubmissionModel, SubmissionStatus
from submit_api.models.submission import SubmissionType
from submit_api.models.submitted_form import SubmittedForm as SubmittedFormModel
from submit_api.utils.token_info import TokenInfo


class SubmissionCreatorFactory(Protocol):
    """Submission creator factory protocol."""

    def create(self, item_id, request_data, session=None) -> SubmissionModel:
        """Create a new submission."""
        return SubmissionModel()

    def replace(self, submission_id, request_data) -> SubmissionModel:
        """Replace a submission."""
        raise BadRequestError("Replace not supported for this submission type.")

    def move(self, submission_id, request_data) -> SubmissionModel:
        """Move a submission."""
        raise BadRequestError("Move not supported for this submission type.")


class FormSubmissionCreator(SubmissionCreatorFactory):
    """Form submission creator."""

    def create(self, item_id, request_data, _session=None):
        """Create a new form submission."""
        if _session:
            return self._create(item_id, request_data, _session)

        with session_scope() as session:
            return self._create(item_id, request_data, session)

    def _create(self, item_id, request_data, session):
        """Create a new form submission."""
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
            item_id, SubmissionType.FORM.value)
        if previous_submission:
            raise ValueError("Form submission already created.")

        submission = SubmissionModel(
            item_id=item_id,
            type=SubmissionType.FORM.value,
            submitted_form_id=submitted_form_id,
            created_by=TokenInfo.get_id()
        )
        session.add(submission)
        session.commit()
        session.flush()
        return submission


class DocumentSubmissionCreator(SubmissionCreatorFactory):
    """Document submission creator."""

    def create(self, item_id, request_data, _session=None):
        """Create a new document submission."""
        if _session:
            return self._create(item_id, request_data, _session)

        with session_scope() as session:
            return self._create(item_id, request_data, session)

    def _create(self, item_id, request_data, session):
        """Create a new document submission."""
        submitted_document = self._create_submitted_document(session, request_data)
        submission: SubmissionModel = self._create_submission(session, item_id, submitted_document.id)

        return submission

    def replace(self, submission_id, request_data):
        """Replace a document submission."""
        with session_scope() as session:
            submission: SubmissionModel = SubmissionModel.find_by_id(
                submission_id)
            if status := submission.status not in [SubmissionStatus.SUBMITTED,
                                                   SubmissionStatus.REJECTED,
                                                   SubmissionStatus.PENDING, SubmissionStatus.PENDING_REPLACEMENT]:
                raise BadRequestError(f"Cannot replace a document with status {status}.")
            submitted_document = self._create_submitted_document(session, request_data)
            new_submission = self._create_submission(
                session=session,
                item_id=submission.item_id,
                submitted_document_id=submitted_document.id,
                original_submission_id=submission.id,  # original is the immediate parent id
                # root id is the first submission id in the chain
                root_submission_id=submission.root_submission_id
            )
            if submission.status == SubmissionStatus.PENDING:
                # For pending submissions, we can safely mark as deleted since they're not yet reviewed
                submission.deleted = True
                submission.active = False
            else:
                # For other submissions, keep them active but mark as pending replacement
                submission.status = SubmissionStatus.PENDING_REPLACEMENT

            session.add(submission)
            return new_submission

    @staticmethod
    def _fill_missing_name(request_data, submission):
        """Find the document name if not in the request."""
        if not request_data.get('name'):
            previous_doc = SubmittedDocumentModel.find_by_id(submission.submitted_document_id)
            if previous_doc:
                request_data['name'] = previous_doc.name

    def _create_next_version_of_target(self, session, submission, request_data):
        """Replace an existing target submission with a new version."""
        target_submission_id = request_data.get("target_submission_id")
        target_submission: SubmissionModel = SubmissionModel.find_by_id(target_submission_id)

        if not target_submission:
            raise ResourceNotFoundError(f"Target submission with ID {target_submission_id} not found.")

        self._fill_missing_name(request_data, submission)
        submitted_document = self._create_submitted_document(session, request_data)

        new_submission = self._create_submission(
            session=session,
            item_id=target_submission.item_id,
            submitted_document_id=submitted_document.id,
            original_submission_id=target_submission.id,
            root_submission_id=target_submission.root_submission_id,
        )

        target_submission.active = False
        session.add(target_submission)

        submission.active = False
        session.add(submission)

        return new_submission

    @staticmethod
    def _restore_previous_active_submission(session, moved_submission):
        """Restore the most recent previous version if none are currently active."""
        # Check if there is any other active submission for the same root_submission_id
        active_exists = session.query(SubmissionModel).filter(
            SubmissionModel.root_submission_id == moved_submission.root_submission_id,
            SubmissionModel.id != moved_submission.id,
            SubmissionModel.deleted.is_(False),
            SubmissionModel.active.is_(True)
        ).first()

        if active_exists:
            # No need to restore — an active submission already exists
            return

        # Find the latest previous non-deleted submission
        previous_version = (
            session.query(SubmissionModel)
            .filter(
                SubmissionModel.item_id == moved_submission.item_id,
                SubmissionModel.root_submission_id == moved_submission.root_submission_id,
                SubmissionModel.id != moved_submission.id,
                SubmissionModel.deleted.is_(False),
                SubmissionModel.active.is_(False),
                SubmissionModel.minor_version == moved_submission.minor_version - 1
            )
            .first()
        )

        if not previous_version.active:
            previous_version.active = True
            session.add(previous_version)

        return

    def _move_to_folder(self, session, submission, request_data):
        """Move document to a specific folder."""
        # Check if there is any other active submission for the same root_submission_id
        if status := submission.status not in [SubmissionStatus.SUBMITTED,
                                               SubmissionStatus.REJECTED,
                                               SubmissionStatus.PENDING, SubmissionStatus.PENDING_REPLACEMENT]:
            raise BadRequestError(f"Cannot replace a document with status {status}.")

        self._fill_missing_name(request_data, submission)
        submitted_document = self._create_submitted_document(session, request_data)

        new_submission = self._create_submission(
            session=session,
            item_id=request_data.get('item_id'),
            submitted_document_id=submitted_document.id
        )
        submission.active = False
        submission.deleted = True

        session.add(submission)

        return new_submission

    def move(self, submission_id, request_data):
        """Move a document submission."""
        with session_scope() as session:
            submission: SubmissionModel = SubmissionModel.find_by_id(submission_id)

            if request_data.get("target_submission_id"):
                moved_submission = self._create_next_version_of_target(session, submission, request_data)
            else:
                moved_submission = self._move_to_folder(session, submission, request_data)
                self._restore_previous_active_submission(session, submission)

            return moved_submission

    @classmethod
    def get_document_version(cls, item_id, original_submission_id=None):
        """Get the latest document version."""
        submission_item = ItemModel.find_by_id(item_id)
        submission_package = PackageModel.find_by_id(submission_item.package_id)
        package_version = submission_package.version
        major_version = package_version.version

        if not original_submission_id or not submission_package.submitted_on:
            minor_version = 1
            return major_version, minor_version

        original_submission = SubmissionModel.find_by_id(original_submission_id)
        if original_submission.status == SubmissionStatus.PENDING:
            minor_version = original_submission.minor_version
            return major_version, minor_version

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
        session.flush()
        return submitted_document

    @staticmethod
    def _create_submission(session, item_id, submitted_document_id, original_submission_id=None,
                           root_submission_id=None):
        """Create a new submission."""
        major_version, minor_version = DocumentSubmissionCreator.get_document_version(item_id, original_submission_id)
        submission = SubmissionModel(
            item_id=item_id,
            type=SubmissionType.DOCUMENT,
            submitted_document_id=submitted_document_id,
            major_version=major_version,
            minor_version=minor_version,
            created_by=TokenInfo.get_id(),
            root_submission_id=root_submission_id
        )
        session.add(submission)
        session.flush()
        # Set `root_submission_id` to its own ID if not provided
        if submission.root_submission_id is None:
            submission.root_submission_id = submission.id
            session.flush()

        return submission
