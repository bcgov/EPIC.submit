"""Service for package management."""
from collections import defaultdict
from datetime import datetime

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import Item as ItemModel
from submit_api.models import Package as PackageModel
from submit_api.models import PackageType as PackageTypeModel
from submit_api.models import PackageVersion as PackageVersionModel
from submit_api.models import UpdateRequest as UpdateRequestModel
from submit_api.models.db import session_scope
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.models.package import PackageStatus
from submit_api.models.package_item_type import PackageItemType as PackageItemTypeModel
from submit_api.models.package_metadata import PackageMetadata as PackageMetadataModel
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.queries.package import PackageQueries
from submit_api.models.submission import SubmissionTypeStatus
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.update_request import UpdateRequestType
from submit_api.utils.constants import (
    MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE, MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE)
from submit_api.utils.token_info import TokenInfo


class PackageService:
    """Package management service."""

    @classmethod
    def get_package_by_id(cls, package_id):
        """Get package by id."""
        package = PackageModel.get_package_by_id_with_items(package_id)
        return package

    @classmethod
    def create_new_package_from_original(cls, original_package_id, session):
        """Create a new package version."""
        original_package = PackageModel.find_by_id(original_package_id)
        package_version = PackageVersionModel.get_by_package_id(
            original_package_id)
        all_package_versions = PackageVersionModel.get_all_by_original_package_id(
            original_package_id)
        if not all_package_versions:
            raise BadRequestError(
                "Cannot create a new version for a package that has no versions")

        latest_version = max(
            package_version.version for package_version in all_package_versions)
        if latest_version != package_version.version:
            raise BadRequestError(
                "Cannot create a new version for a package that is not the latest version")

        new_version = latest_version + 1
        new_package_data = {
            "name": original_package.name,
        }
        package_type = original_package.type
        new_package = cls._create_package(
            session, original_package.account_project_id, new_package_data, package_type)
        cls._create_package_version(
            session, package_id=new_package.id, original_package_id=original_package.id, version=new_version)
        new_metadata = {
            PackageMetadataFields.CONDITION.value: original_package.meta.json.get(
                PackageMetadataFields.CONDITION.value, None),
        }
        cls._create_package_metadata(
            session, new_package.id, new_metadata)
        cls._create_items(session, new_package.id, package_type)
        return new_package

    @classmethod
    def create_first_package(cls, account_project_id, request_data):
        """Create a new package."""
        with session_scope() as session:
            package_type = PackageTypeModel.find_by_name(
                request_data.get("type"))
            package = cls._create_package(
                session, account_project_id, request_data, package_type)
            cls._create_package_version(
                session, package_id=package.id, original_package_id=package.id, version=1)
            cls._create_package_metadata(
                session, package.id, request_data.get("metadata"))
            cls._create_items(session, package.id, package_type)
            session.commit()
        return PackageModel.find_by_id(package.id)

    @staticmethod
    def _create_package(session, account_project_id, request_data, package_type):
        """Create a new package."""
        package_data = {
            "account_project_id": account_project_id,
            "name": request_data.get("name"),
            "type_id": package_type.id,
        }
        package = PackageModel(**package_data)
        session.add(package)
        session.flush()
        return package

    @staticmethod
    def _create_package_metadata(session, package_id, metadata):
        """Create package metadata."""
        package_metadata = PackageMetadataModel(
            package_id=package_id, json=metadata
        )
        session.add(package_metadata)

    @staticmethod
    def _update_package_metadata(session, package_id, metadata_updates):
        """Update specific fields in package metadata by package ID."""
        # Retrieve the existing package metadata
        package_metadata = PackageMetadataModel.get_by_package_id(package_id)

        if not package_metadata:
            raise ValueError(f"Package metadata for package_id {package_id} does not exist.")

        metadata = package_metadata.json or {}
        new_metadata = {**metadata, **metadata_updates}

        # Add the updated metadata back to the session
        package_metadata.json = new_metadata
        session.add(package_metadata)

    @classmethod
    def _create_package_version(cls, session, package_id, original_package_id, version=1):
        """Create a new package version."""
        package_version = PackageVersionModel(
            package_id=package_id,
            original_package_id=original_package_id,
            version=version
        )
        session.add(package_version)

    @classmethod
    def get_all_package_versions(cls, package_id):
        """Get all package versions by package ID."""
        package_version = PackageVersionModel.get_by_package_id(package_id)
        all_package_versions = PackageVersionModel.get_all_by_original_package_id(package_version.original_package_id)
        return all_package_versions

    @staticmethod
    def _create_items(session, package_id, package_type):
        """Create items for the package."""
        package_item_types = session.query(PackageItemTypeModel).filter_by(
            package_type_id=package_type.id,
        ).all()

        item_type_to_package_item_type = {
            pit.item_type_id: pit for pit in package_item_types
        }

        for item_type in package_type.item_types:
            package_item_type = item_type_to_package_item_type.get(
                item_type.id)
            if package_item_type:
                item = ItemModel(
                    package_id=package_id,
                    type_id=item_type.id,
                    sort_order=package_item_type.sort_order
                )
                session.add(item)

        session.flush()

    @staticmethod
    def _get_and_validate_complete_package(package_id) -> PackageModel:
        """Retrieve and validate that all items in the package are completed."""
        package = PackageModel.find_by_id(package_id)
        if any(item.status.value != ItemStatus.COMPLETED.value for item in package.items):
            raise BadRequestError(
                "All items must be completed before completing the package")
        return package

    @staticmethod
    def _update_package_status(package_id, session, package=None):
        """Update the status of the package based on the statuses of its items."""
        PackageQueries.update_package_status(package_id, session, package)

    @staticmethod
    def _update_items_status(items, status, session):
        """Update status of all items in the package."""
        for item in items:
            item.status = status
            session.add(item)

    @staticmethod
    def _update_mp_item(items, data, session):
        """Update the status of all items in the package."""
        for item in items:
            if item.type.name == SubmissionItemType.MANAGEMENT_PLAN_FORM.value:
                item.status = data.get('status')
                item.review_start_date = data.get('review_start_date')
                session.add(item)

    @staticmethod
    def _update_cr_status(items, status, session):
        """Update the status of all items in the package."""
        for item in items:
            if item.type.name == SubmissionItemType.CONSULTATION_RECORD.value:
                item.status = status
                item.review_start_date = datetime.utcnow()
                session.add(item)

    @staticmethod
    def _update_package_submission_details(package, session):
        """Update package submission details."""
        package.submitted_on = datetime.utcnow()
        package.submitted_by = TokenInfo.get_id()

        session.add(package)

    @staticmethod
    def _deactivate_revision_required_requests(package, session):
        """Update package submission details."""
        revision_required_requests = [request for request in package.update_requests
                                      if request.type == UpdateRequestType.REVIEW]
        for request in revision_required_requests:
            request.active = False
            session.add(request)

    @staticmethod
    def _get_document_submissions_from_package(package):
        """Get submissions from package."""
        submissions = []
        for item in package.items:
            for submission in item.submissions:
                if submission.type == SubmissionTypeStatus.DOCUMENT:
                    submissions.append(submission)
        return submissions

    @classmethod
    def submit_package(cls, package_id):
        """Submit the package by updating its status and items."""
        package = cls._get_and_validate_complete_package(package_id)

        with session_scope() as session:
            cls._update_items_status(
                package.items, ItemStatus.SUBMITTED.value, session)
            cls._update_package_status(package_id, session, package)
            cls._update_package_submission_details(package, session)
            cls._create_email_queue_record(package, session)
            cls._deactivate_revision_required_requests(package, session)
            session.flush()
            session.commit()
        return package

    @classmethod
    def start_mp_review(cls, package_id, _session=None):
        """Start the review process for the package."""
        package = cls._get_and_validate_package_for_starting_review(package_id)

        if _session is None:
            with session_scope() as session:
                cls.start_mp_review_process(package, package_id, session)
        else:
            cls.start_mp_review_process(package, package_id, _session)

        return package

    @classmethod
    def start_mp_review_process(cls, package, package_id, session):
        """Common logic for starting the review process."""
        item_data = {
            'status': ItemStatus.UNDER_REVIEW.value,
            'review_start_date': datetime.utcnow().isoformat()
        }
        cls._update_mp_item(package.items, item_data, session)
        cls._update_package_status(package_id, session, package)
        new_metadata = {
            PackageMetadataFields.REVIEW_START_DATE.value: item_data.get('review_start_date')
        }
        cls._update_package_metadata(session, package_id, new_metadata)

    @classmethod
    def start_cr_check(cls, package_id):
        """Start the consultation check process for the package."""
        package = cls._get_and_validate_package_for_starting_review(package_id)
        with session_scope() as session:
            cls._update_cr_status(
                package.items, ItemStatus.UNDER_CONSULTATION_CHECK.value, session)
            cls._update_package_status(package_id, session, package)
            new_metadata = {
                PackageMetadataFields.CONSULTATION_CHECK_START_DATE.value: datetime.utcnow().isoformat()
            }
            cls._update_package_metadata(session, package_id, new_metadata)
            session.flush()
            session.commit()
            return package

    @staticmethod
    def _unsupported_status(*args, **kwargs):
        """Handle unsupported status."""
        raise BadRequestError("Status is not supported.")

    @staticmethod
    def _create_email_queue_record(package, session):
        """Create an email queue record."""
        email_queue = EmailQueueModel(
            entity_id=package.id, entity_type=EntityType.PACKAGE.value,
            template_name=MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE
        )
        session.add(email_queue)

    @classmethod
    def _get_state_updater(cls, status) -> callable:
        """Retrieve the appropriate state updater function based on status."""
        state_updaters = defaultdict(
            lambda: cls._unsupported_status,
            {
                PackageStatus.SUBMITTED.value: cls.submit_package,
                PackageStatus.UNDER_REVIEW.value: cls.start_mp_review,
                PackageStatus.UNDER_CONSULTATION_CHECK.value: cls.start_cr_check,
            }
        )
        return state_updaters[status]

    @classmethod
    def update_package_state(cls, package_id, request_data):
        """Update the state of the package based on the provided status."""
        status = request_data.get("status")
        state_updater = cls._get_state_updater(status)
        return state_updater(package_id)

    @classmethod
    def create_update_request(cls, package_id, request_data):
        """Create an update request for the package."""
        package = cls._get_and_validate_package_for_update_request(package_id)
        cls._create_update_request(package, request_data)
        cls._update_request_creation_email_queue(package.id)
        return package

    @classmethod
    def _create_update_request(cls, package, request_data):
        """Create an update request for the package."""
        update_request = UpdateRequestModel(
            submission_package_id=package.id,
            submission_item_ids=request_data.get("submission_item_ids"),
            reason=request_data.get("reason"),
            created_by=TokenInfo.get_id()
        )
        update_request.save()
        return update_request

    @classmethod
    def _update_request_creation_email_queue(cls, package_id):
        """Create an email queue record for an update request."""
        email_queue = EmailQueueModel(
            entity_id=package_id, entity_type=EntityType.PACKAGE.value,
            template_name=MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE
        )
        email_queue.save()

    @classmethod
    def _get_and_validate_package_for_update_request(cls, package_id):
        """Validate package status for update request."""
        package = cls.get_package_by_id(package_id)
        if not package:
            raise ResourceNotFoundError("Package not found")
        if not package.submitted_on:
            raise BadRequestError(
                "Cannot create an update request for a package that has not been submitted")
        if package.status == PackageStatus.APPROVED:
            raise BadRequestError(
                "Cannot create an update request for a package that has been approved")
        if package.status == PackageStatus.REJECTED:
            raise BadRequestError(
                "Cannot create an update request for a package that has been rejected")
        return package

    @classmethod
    def _get_and_validate_package_for_starting_review(cls, package_id):
        """Validate package status for update request."""
        package = cls.get_package_by_id(package_id)
        if not package:
            raise ResourceNotFoundError("Package not found")
        if package.status == PackageStatus.APPROVED:
            raise BadRequestError(
                "Cannot create a review for a package that has been approved")
        if package.status == PackageStatus.REJECTED:
            raise BadRequestError(
                "Cannot create a review for a package that has been rejected")
        return package

    @classmethod
    def create_update_request_note(cls, package_id, update_request_id, request_data):
        """Create a note for an update request."""
        update_request = UpdateRequestModel.find_by_id(update_request_id)
        cls._validate_create_update_request_note(package_id, update_request)
        update_request.note = request_data.get("note")
        update_request.save()
        package = cls.get_package_by_id(package_id)
        return package

    @classmethod
    def _validate_create_update_request_note(cls, package_id, update_request):
        """Validate the creation of an update request note."""
        if not update_request:
            raise ResourceNotFoundError("Update request not found")
        if update_request.submission_package_id != package_id:
            raise BadRequestError(
                "Update request does not belong to the specified package")
        if update_request.note:
            raise BadRequestError(
                "Note already exists for the update request")
        if not update_request.active:
            raise BadRequestError("Update request is not active")
