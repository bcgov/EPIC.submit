"""Service for submission management."""
from flask import current_app

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import BadRequestError
from submit_api.models import Item as ItemModel, Package as PackageModel
from submit_api.models.package import PackageStatus
from submit_api.models.update_request import UpdateRequestStatus
from submit_api.models.db import db, session_scope
from submit_api.models.geo_data_upload import GeoDataUpload
from submit_api.models.item_type import SubmissionMethod
from submit_api.models.package_item_type import PackageItemType
from submit_api.enums.package_type import PackageApprovalType
from submit_api.models.queries.package import PackageSubmissionQueries
from submit_api.models.submission import Submission as SubmissionModel, SubmissionType, \
    SubmissionStatus, ALLOWED_TRANSITIONS
from submit_api.services import authorization
from submit_api.services.document_service_client import DocumentServiceClient
from submit_api.services.geo_processor import GeoService
from submit_api.services.item_service import ItemService
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
        cls._validate_package_not_acknowledged(item_id)
        is_geospatial = False
        with session_scope() as session:
            submission_type = request_data.get("type")
            submission_creator = cls.make_submission_creator(submission_type)

            submission_data = request_data.get("data")
            submission = submission_creator.create(item_id, submission_data, session)

            status = request_data.get("status")
            cls.update_submission_item_status(item_id, status, session)

            # Set is_updated flag on the submission only if package has already been submitted
            item = ItemModel.find_by_id(item_id)
            if item and item.package.submitted_on:
                submission.is_updated = True
                session.add(submission)

            # Check if the document being created is geospatial
            is_geospatial = (submission.type == SubmissionType.DOCUMENT and
                             submission.submitted_document and
                             submission.submitted_document.folder == 'geospatial')

        if is_geospatial:
            cls.trigger_geo_process(item_id)

        return submission

    @classmethod
    def replace_submission(cls, submission_id, request_data):
        """Create a new submission."""
        submission = cls.get_submission_by_id(submission_id)
        cls._check_assigned_on_package(submission.item_id)
        cls._validate_package_not_acknowledged(submission.item_id)
        cls._validate_package_is_open(submission.id)
        submission_type = request_data.get("type")
        submission_creator = cls.make_submission_creator(submission_type)
        submission_data = request_data.get("data")

        # Check if the document being replaced is geospatial
        is_geospatial = (submission.type == SubmissionType.DOCUMENT and
                         submission.submitted_document and
                         submission.submitted_document.folder == 'geospatial')

        url_to_cleanup = None
        if is_geospatial and submission.status == SubmissionStatus.PENDING:
            url_to_cleanup = submission.submitted_document.url

        new_submission = submission_creator.replace(submission_id, submission_data)

        # Set is_updated flag on the submission only if package has already been submitted
        with session_scope() as session:
            item = ItemModel.find_by_id(new_submission.item_id)
            if item and item.package.submitted_on:
                new_submission.is_updated = True
                session.add(new_submission)

        if is_geospatial:
            cls.trigger_geo_process(new_submission.item_id)

        if url_to_cleanup:
            cls._cleanup_document_artifacts(url_to_cleanup)

        return new_submission

    @classmethod
    def move_submission(cls, submission_id, request_data):
        """Move an existing submission document."""
        submission = cls.get_submission_by_id(submission_id)
        cls._check_assigned_on_package(submission.item_id)
        cls._validate_package_is_open(submission.id)
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

        submission_item = ItemModel.find_by_id(submission.item_id)
        if not submission_item:
            raise ValueError("Item not found.")
        if submission_item.status in [ItemStatus.ACCEPTED, ItemStatus.SATISFIED,
                                      ItemStatus.APPROVED, ItemStatus.PASSED_CONSULTATION_CHECK]:
            raise ValueError("Section is already completed.")
        submission_package = PackageModel.find_by_id(submission_item.package_id)
        is_business_data = submission_item.type.submission_method == SubmissionMethod.FORM_SUBMISSION
        if not is_business_data and submission_package.completed_on:
            raise ValueError("Package is already completed.")
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
    def update_submission_status(cls, submission_id, status):
        """Update the status of the submission."""
        with session_scope() as session:
            submission = cls.get_submission_by_id(submission_id)
            existing_status = submission.status
            if existing_status != status:
                # Resolve the approval type from the submission's package
                package = cls.get_package_by_submission_id(submission_id)
                approval_type = package.type.approval_type

                if approval_type is None:
                    if not package.type.versioning_enabled:
                        approval_type = PackageApprovalType.B

                if approval_type is None:
                    raise ValueError(
                        f"Package type '{package.type.name}' has no approval type configured. "
                        "Cannot validate status transition."
                    )

                # Validate state transition
                cls._validate_submission_status_transition(approval_type, existing_status, SubmissionStatus[status])

                submission.status = status

                # Set is_updated to False on the submission when status changes to VERIFIED or ACKNOWLEDGED
                if status in [SubmissionStatus.VERIFIED.value, SubmissionStatus.ACKNOWLEDGED.value]:
                    submission.is_updated = False

                session.add(submission)
                session.flush()

                PackageSubmissionQueries.update_package_status_from_submissions(package.id, session, package)
                current_app.logger.info(f"Submission {submission_id} status updated to {status}.")
            return submission

    @classmethod
    def _validate_submission_status_transition(cls, approval_type, current_status, next_status):
        """Enforces valid status transitions based on package approval type."""
        transitions = ALLOWED_TRANSITIONS.get(approval_type)
        if transitions is None:
            raise ValueError(f"No transition rules defined for approval type: {approval_type}")

        allowed = transitions.get(current_status)
        if not allowed:
            raise ValueError(
                f"Status '{current_status.value}' has no valid transitions for "
                f"{approval_type.value} packages."
            )

        if next_status not in allowed:
            raise ValueError(
                f"Cannot transition from '{current_status.value}' to '{next_status.value}' "
                f"for {approval_type.value} packages. "
                f"Valid transitions: {sorted(s.value for s in allowed)}"
            )

    @classmethod
    def update_submission_item_status(cls, item_id, status, session):
        """Update the status of the submission item."""
        if not status:
            return

        # Validate required document submissions before marking as COMPLETED
        if status == ItemStatus.COMPLETED.value:
            cls._validate_required_document_submission(item_id)

        ItemService.update_submission_item_status(item_id, status, session)

    @classmethod
    def _validate_required_document_submission(cls, item_id):
        """Validate that required document items have at least one document submission."""
        # Get the item with its relationships
        item = ItemModel.find_by_id(item_id)
        if not item:
            raise BadRequestError("Item not found.")

        # Check if this item type is required for the package type
        package = PackageModel.find_by_id(item.package_id)
        if not package:
            raise BadRequestError("Package not found.")

        package_item_type = PackageItemType.query.filter_by(
            package_type_id=package.type_id,
            item_type_id=item.type_id
        ).first()

        # Only validate if the item is required
        if not package_item_type or not package_item_type.is_required:
            return

        # Only validate for document upload items
        if item.type.submission_method != SubmissionMethod.DOCUMENT_UPLOAD:
            return

        # Check if there's at least one active submission with a document
        has_document_submission = any(
            submission.type == SubmissionType.DOCUMENT and
            submission.submitted_document_id is not None
            for submission in item.submissions
        )

        if not has_document_submission:
            raise BadRequestError(
                f"Cannot mark item as COMPLETED. Required documents are missing for '{item.type.name}'."
            )

    @classmethod
    def delete_submission(cls, submission_id):
        """Delete a submission."""
        submission = SubmissionModel.find_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found.")
        cls._check_assigned_on_package(submission.item_id)
        cls._validate_package_not_acknowledged(submission.item_id)
        cls._validate_package_is_open(submission.id)

        url_to_delete = None
        if submission.type == SubmissionType.DOCUMENT and submission.submitted_document:
            if submission.submitted_document.folder == 'geospatial':
                url_to_delete = submission.submitted_document.url

        # Set is_updated flag on the submission before deleting (only if package has been submitted)
        item = ItemModel.find_by_id(submission.item_id)
        if item and item.package.submitted_on:
            submission.is_updated = True
            db.session.add(submission)
            db.session.commit()

        submission.delete()

        if url_to_delete:
            cls._cleanup_document_artifacts(url_to_delete)

        return submission

    @classmethod
    def _cleanup_document_artifacts(cls, url_to_delete):
        """Clean up S3 artifacts and GeoDataUpload records associated with a document URL."""
        geo_upload = GeoDataUpload.query.filter_by(raw_s3_key=url_to_delete).first()

        try:
            current_app.logger.info(f"Requesting S3 deletion for {url_to_delete}")
            presigned_url = DocumentServiceClient.get_presigned_delete_url(url_to_delete)
            DocumentServiceClient.delete_via_presigned_url(presigned_url)
        except Exception as exc:  # pylint: disable=broad-except # noqa: B902
            current_app.logger.warning("Failed to delete document from S3 %s: %s", url_to_delete, exc)

        if geo_upload:
            for s3_key in [geo_upload.preview_s3_key, geo_upload.standard_s3_key]:
                if s3_key:
                    try:
                        current_app.logger.info("Requesting S3 deletion for processed layer %s", s3_key)
                        del_url = DocumentServiceClient.get_presigned_delete_url(s3_key)
                        DocumentServiceClient.delete_via_presigned_url(del_url)
                    except Exception as exc:  # pylint: disable=broad-except # noqa: B902
                        current_app.logger.warning("Failed to delete processed layer from S3 %s: %s", s3_key, exc)

            current_app.logger.info("Deleting associated GeoDataUpload record for %s", url_to_delete)
            db.session.delete(geo_upload)
            db.session.commit()

    @classmethod
    def soft_delete_submission(cls, submission_id):
        """Delete a submission."""
        submission = SubmissionModel.find_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found.")
        cls._validate_package_not_acknowledged(submission.item_id)
        cls._validate_package_is_open(submission.id)

        # Set is_updated flag on the submission before soft deleting (only if package has been submitted)
        with session_scope() as session:
            item = ItemModel.find_by_id(submission.item_id)
            if item and item.package.submitted_on:
                submission.is_updated = True
                session.add(submission)

        submission_creator = cls.make_submission_creator(submission.type.value)
        deleted_submission = submission_creator.soft_delete(submission_id)
        return deleted_submission

    @classmethod
    def get_all_versions(cls, submission_id):
        """Fetch all versions of a submission by its root submission ID."""
        with session_scope():
            submission: SubmissionModel = SubmissionModel.find_by_id(submission_id)
            if not submission:
                current_app.logger.error("Submission with id %s not found for get_all_versions.", submission_id)
                return None

            root_submission_id = submission.root_submission_id or submission.id
            current_app.logger.debug("Fetching all versions for root_submission_id: %s.", root_submission_id)
            return SubmissionModel.find_all_versions(root_submission_id)

    @classmethod
    def _check_assigned_on_package(cls, item_id):
        """Check if the item is assigned on the package."""
        item = ItemModel.find_by_id(item_id)
        if not item:
            raise ValueError("Item not found.")
        authorization.has_access_to_package(item.package_id)

    @classmethod
    def get_package_by_submission_id(cls, submission_id):
        """Get package by submission id."""
        submission = SubmissionModel.find_by_id(submission_id)
        if not submission:
            raise ValueError("Submission not found.")
        item = ItemModel.find_by_id(submission.item_id)
        if not item:
            raise ValueError("Item not found.")
        submission_package = PackageModel.find_by_id(item.package_id)
        if not submission_package:
            raise ValueError("Package not found.")
        return submission_package

    @classmethod
    def _validate_package_is_open(cls, submission_id, submission_package=None):
        """Validate if the package is open."""
        if not submission_package:
            submission_package = cls.get_package_by_submission_id(submission_id)
        if submission_package.completed_on:
            raise ValueError("Package is already completed.")
        return submission_package

    @classmethod
    def trigger_geo_process(cls, item_id):
        """Trigger geospatial processing for newly uploaded files related to an item."""
        submissions = SubmissionModel.query.filter_by(
            item_id=item_id,
            type=SubmissionType.DOCUMENT,
            deleted=False,
            active=True
        ).all()

        triggered_uploads = []
        # pylint: disable=protected-access
        app = current_app._get_current_object()

        for sub in submissions:
            if not sub.submitted_document:
                continue

            doc = sub.submitted_document
            if doc.folder != 'geospatial':
                continue

            ext = doc.name.split('.')[-1].lower() if '.' in doc.name else ''
            if ext not in ('shp', 'zip'):
                continue

            # Skip if already being tracked
            existing = GeoDataUpload.query.filter_by(raw_s3_key=doc.url).first()
            if existing:
                continue

            upload = GeoDataUpload(
                filename=doc.name,
                file_type=ext,
                file_size_kb=0.0,
                raw_s3_key=doc.url,
                status='processing',
            )
            db.session.add(upload)
            db.session.flush()
            triggered_uploads.append(upload)

        db.session.commit()

        result = []
        for upload in triggered_uploads:
            # pylint: disable=protected-access
            GeoService._spawn_processing_thread(app, upload.id)
            result.append({'id': upload.id, 'filename': upload.filename})

        return result

    @classmethod
    def _validate_package_not_acknowledged(cls, item_id):
        """Validate that the package is not acknowledged without open update requests."""
        item = ItemModel.find_by_id(item_id)
        if not item:
            raise ValueError("Item not found.")

        package = item.package
        if not package:
            raise ValueError("Package not found.")

        # Block if package is approved, rejected, or not approved
        if PackageStatus.APPROVED in package.status:
            raise BadRequestError("Cannot add documents to an approved package")
        if PackageStatus.REJECTED in package.status:
            raise BadRequestError("Cannot add documents to a rejected package")
        if PackageStatus.NOT_APPROVED in package.status:
            raise BadRequestError("Cannot add documents to a not approved package")

        # Check if package is acknowledged
        is_acknowledged = PackageStatus.ACKNOWLEDGED.value in package.status

        # Get open update requests
        open_update_requests = [request for request in package.update_requests
                                if request.status == UpdateRequestStatus.OPEN.value]

        # Block if acknowledged without open update requests
        if is_acknowledged and not open_update_requests:
            raise BadRequestError("Cannot add items to an acknowledged package without an open update request")

        # Validate item type is requested in open update requests
        if open_update_requests:
            cls._validate_item_type_requested(item, open_update_requests)

    @classmethod
    def _validate_item_type_requested(cls, item, open_update_requests):
        """Validate that the item type is requested in at least one open update request."""
        item_type_id = item.type_id

        # Check if any open update request includes this item type
        is_requested = any(
            item_type_id in request.submission_item_types
            for request in open_update_requests
        )

        if not is_requested:
            raise BadRequestError(
                f"Cannot add items to '{item.type.name}' section. "
                f"This section is not included in any open update requests."
            )
