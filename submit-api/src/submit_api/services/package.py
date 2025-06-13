"""Service for package management."""
from collections import defaultdict
from datetime import datetime

from flask import current_app

from submit_api.enums.activity_type import ActorTypeEnum, ActivityActionType
from submit_api.enums.item_status import ItemStatus
from submit_api.enums.package_type import PackageTypeEnum
from submit_api.enums.role import ProponentPermissionsEnum
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import Item as ItemModel, User
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
from submit_api.models.submission import SubmissionType, SubmissionStatus
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.submission_review import SubmissionReviewStatus
from submit_api.models.update_request import UpdateRequestType, UpdateRequestStatus
from submit_api.models.user import UserType
from submit_api.services import authorization
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.utils.constants import (
    MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE, MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE,
    MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE, MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE)
from submit_api.utils.token_info import TokenInfo
from submit_api.services.package_version_service import PackageVersionService


class PackageService:
    """Package management service."""

    @classmethod
    def get_package_by_id(cls, package_id):
        """Get package by id."""
        package = PackageModel.get_package_by_id_with_items(package_id)
        return package

    @classmethod
    def create_new_package_from_original(cls, current_package_id, session):
        """Create a new package version."""
        return PackageVersionService.create_new_package_version(current_package_id, session)

    @classmethod
    def create_first_package(cls, account_project_id, request_data):
        """Create a new package."""
        with session_scope() as session:
            package_type = PackageTypeModel.find_by_name(
                request_data.get("type"))
            package = cls._create_package(
                session, account_project_id, request_data, package_type)
            package_version = cls._create_package_version(
                session, original_package_id=package.id, version=1)
            package.version_id = package_version.id
            session.add(package)
            cls._create_package_metadata(
                session, package.id, request_data.get("metadata"))
            cls._create_items(session, package.id, package_type)
            session.commit()
        return PackageModel.find_by_id(package.id)

    @staticmethod
    def _create_package(session, account_project_id, request_data, package_type):
        """Create a new package."""
        current_app.logger.info(f"Creating a new package for account project {account_project_id}")
        package_data = {
            "account_project_id": account_project_id,
            "name": request_data.get("name"),
            "type_id": package_type.id,
        }
        package = PackageModel(**package_data)
        session.add(package)
        session.flush()
        current_app.logger.info(f"Created package {package.id} for account project {account_project_id}")
        return package

    @classmethod
    def create_new_package_version_with_contacts(cls, package_id):
        """Create a new package version with contact information and cleanup."""
        with session_scope() as session:
            current_app.logger.info(f"Creating new package version for package {package_id}")

            original_package = PackageModel.find_by_id(package_id)
            if not original_package:
                raise ResourceNotFoundError(f"Package {package_id} not found")

            new_package = cls.create_new_package_from_original(package_id, session)

            PackageVersionService.copy_contact_information(original_package, new_package)

            PackageVersionService.deactivate_update_requests(original_package.id, session, original_package)

            PackageVersionService.create_email_queue(
                original_package.id,
                MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE
            )

            session.add(new_package)
            session.flush()

            current_app.logger.info(f"New package version created for {new_package.name}")
            return new_package

    @classmethod
    def _create_resubmission_email_queue(cls, package_id):
        """Create an email queue record for resubmission request."""
        email_queue = EmailQueueModel(
            entity_id=package_id,
            entity_type=EntityType.PACKAGE.value,
            template_name=MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE
        )
        email_queue.save()

    @staticmethod
    def _create_package_metadata(session, package_id, metadata):
        """Create package metadata."""
        current_app.logger.info(f"Creating metadata for package {package_id}")
        package_metadata = PackageMetadataModel(
            package_id=package_id, json=metadata
        )
        session.add(package_metadata)
        current_app.logger.info(f"Created metadata for package {package_id}")

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
    def _create_package_version(cls, session, original_package_id, version=1):
        """Create a new package version."""
        current_app.logger.info(f"Creating a new package version for package {original_package_id}")
        package_version = PackageVersionModel(
            original_package_id=original_package_id,
            version=version
        )
        session.add(package_version)
        session.flush()
        current_app.logger.info(f"Created package version {package_version.id} for package {original_package_id}")
        return package_version

    @classmethod
    def get_all_package_versions_by_original_package_id(cls, original_package_id):
        """Get all package versions by original package id."""
        all_package_versions = PackageVersionModel.get_all_by_original_package_id(original_package_id)
        return all_package_versions

    @staticmethod
    def _create_items(session, package_id, package_type):
        """Create items for the package."""
        current_app.logger.info(f"Creating items for package {package_id}")
        package_item_types = session.query(PackageItemTypeModel).filter_by(
            package_type_id=package_type.id,
        ).all()

        item_type_to_package_item_type = {
            pit.item_type_id: pit for pit in package_item_types
        }

        for item_type in package_type.item_types:
            current_app.logger.info(f"Creating item for package {package_id} with item type {item_type.name}")
            package_item_type = item_type_to_package_item_type.get(
                item_type.id)
            if package_item_type:
                item = ItemModel(
                    package_id=package_id,
                    type_id=item_type.id,
                    sort_order=package_item_type.sort_order
                )
                session.add(item)
                (current_app.logger
                 .info(f"Created item {item.id} for package {package_id} with item type {item_type.name}"))
        current_app.logger.info(f"Created items for package {package_id}")
        session.flush()

    @classmethod
    def _get_and_validate_complete_package(cls, package_id) -> PackageModel:
        """Retrieve and validate that all items in the package are completed."""
        package = PackageModel.find_by_id(package_id)
        if package.submitted_on:
            return cls._validate_package_for_resubmit(package)

        if any(item.status.value != ItemStatus.COMPLETED.value for item in package.items):
            current_app.logger.info(f"Package {package_id} has incomplete items")
            raise BadRequestError("All items must be completed before completing the package")

        current_app.logger.info(f"Package {package_id} is ready to submit")
        return package

    @classmethod
    def _validate_package_for_resubmit(cls, package) -> PackageModel:
        """Validate that the package is in a state that allows resubmission."""
        current_app.logger.info(f"Validating package {package.id} for resubmission")
        if not package.submitted_on:
            raise BadRequestError("Cannot resubmit a package that has not been submitted")
        if package.status == PackageStatus.APPROVED:
            raise BadRequestError("Cannot resubmit a package that has been approved")
        if package.status == PackageStatus.REJECTED:
            raise BadRequestError("Cannot resubmit a package that has been rejected")
        if not package.update_requests:
            raise BadRequestError("Cannot resubmit a package that has no update requests")
        current_app.logger.info(f"Package {package.id} is ready to resubmit")
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
        session.flush()

    @staticmethod
    def _update_review_item(review_item, data, session):
        """Update the status of all items in the package."""
        review_item.status = data.get('status')
        review_item.review_start_date = data.get('review_start_date')
        session.add(review_item)

    @staticmethod
    def _update_cr_status(items, data, session):
        """Update the status of all items in the package."""
        cr_item = next((item for item in items
                        if item.type.name == SubmissionItemType.CONSULTATION_RECORD.value), None)
        if not cr_item:
            raise BadRequestError("Consultation record not found in package")
        if cr_item.status != ItemStatus.SUBMITTED:
            raise BadRequestError("Consultation record in package is not submitted")
        cr_item.status = data.get('status')
        cr_item.review_start_date = data.get('review_start_date')
        session.add(cr_item)

    @staticmethod
    def _update_package_submission_details(package, session):
        """Update package submission details."""
        current_app.logger.info(f"Updating submission details for package {package.id}")
        package.submitted_on = datetime.utcnow()
        package.submitted_by = TokenInfo.get_id()

        session.add(package)

    @staticmethod
    def update_submission_status(package, status, session):
        """Update package submission details."""
        if status not in SubmissionStatus.__members__:
            raise BadRequestError("Invalid status")
        submissions = [submission for item in package.items for submission in item.submissions]
        for submission in submissions:
            if submission.status == SubmissionStatus.PENDING_REPLACEMENT:
                submission.active = False
            submission.status = status
            session.add(submission)

    @staticmethod
    def _deactivate_revision_required_requests(package, session):
        """Update package submission details."""
        current_app.logger.info(f"Deactivating revision required requests for package {package.id}")
        revision_required_requests = [request for request in package.update_requests
                                      if request.type == UpdateRequestType.REVIEW]
        for request in revision_required_requests:
            request.status = UpdateRequestStatus.PENDING_REVIEW.value
            session.add(request)

    @staticmethod
    def _update_update_requests(session, package, status, active=True):
        """Update package submission details."""
        current_app.logger.info(f"Updating update requests for package {package.id}")
        revision_required_requests = [request for request in package.update_requests
                                      if request.type == UpdateRequestType.UPDATE]
        for request in revision_required_requests:
            request.status = status
            request.active = active
            session.add(request)

    @staticmethod
    def _get_document_submissions_from_package(package):
        """Get submissions from package."""
        submissions = []
        for item in package.items:
            for submission in item.submissions:
                if submission.type == SubmissionType.DOCUMENT:
                    submissions.append(submission)
        return submissions

    @classmethod
    def submit_package(cls, package_id):
        """Submit the package by updating its status and items."""
        cls._validate_account_user()
        authorization.check_has_permission([ProponentPermissionsEnum.SUBMIT_PACKAGE.value])
        with session_scope() as session:
            package = cls._get_and_validate_complete_package(package_id)
            if package.submitted_on:
                submitted_package: PackageModel = cls._resubmit_package(package, session)
            else:
                submitted_package: PackageModel = cls._submit_package(package, session)

            return submitted_package

    @classmethod
    def _submit_package(cls, package, session):
        """Submit the package by updating its status and items."""
        cls._update_items_status(
            package.items, ItemStatus.SUBMITTED.value, session)
        cls._update_package_status(package.id, session, package)
        cls._update_package_submission_details(package, session)
        cls.update_submission_status(package, SubmissionStatus.SUBMITTED.value, session)
        cls._deactivate_revision_required_requests(package, session)
        cls._create_email_queue_record(package, session)
        cls._log_activity_submission(package, ActivityActionType.SUBMITTED_TO_EAO.value, session)
        return package

    @classmethod
    def _resubmit_package(cls, package, session):
        """Submit the package by updating its status and items."""
        current_app.logger.info(f"Resubmitting package {package.id}")
        open_update_requests = [request for request in package.update_requests
                                if request.status != UpdateRequestStatus.ACCEPTED.value]
        if not open_update_requests:
            raise BadRequestError("Cannot resubmit a package that has no open update requests")
        if package.completed_on:
            raise BadRequestError("Cannot resubmit a package that has been completed")
        cls._update_package_submission_details(package, session)
        cls.update_submission_status(package, SubmissionStatus.SUBMITTED.value, session)
        cls._create_email_queue_record(package, session)
        cls._deactivate_revision_required_requests(package, session)
        cls._update_update_requests(session, package, status=UpdateRequestStatus.PENDING_REVIEW.value)
        cls._deactivate_fail_reviews(package, session)
        cls._log_activity_submission(package, ActivityActionType.UPDATED_SUBMISSION.value, session)
        return package

    @classmethod
    def accept_update_request(cls, package_id, update_request_id):
        """Submit the package by updating its status and items."""
        with session_scope() as session:
            package = cls.get_package_by_id(package_id)
            update_request = UpdateRequestModel.find_by_id(update_request_id)
            cls._validate_accept_update_request(package, update_request)
            update_request = UpdateRequestModel.find_by_id(update_request_id)
            update_request.status = UpdateRequestStatus.ACCEPTED.value
            update_request.active = False
            session.add(update_request)
            session.flush()
            return package

    @classmethod
    def _validate_accept_update_request(cls, package, update_request):
        """Validate the accept update request."""
        if not package:
            raise BadRequestError("Package not found")

        if not update_request:
            raise BadRequestError("Update request not found")
        if update_request.submission_package_id != package.id:
            raise BadRequestError("Update request does not belong to the specified package")
        if update_request.status != UpdateRequestStatus.PENDING_REVIEW.value:
            raise BadRequestError("Update request is not pending review")

    @staticmethod
    def _log_activity_submission(package, action, session):
        """Log activity for package submission."""
        ActivityLogService.log_activity(
            entity_id=package.version.original_package_id,
            action=action,
            actor_type=ActorTypeEnum.ENTITY.value,
            entity_version=package.version.version,
            session=session
        )

    @classmethod
    def _deactivate_fail_reviews(cls, package, session):
        """Deactivate all fail reviews for the package."""
        current_app.logger.info(f"Deactivating fail reviews for package {package.id}")
        fail_reviews = [item.review for item in package.items
                        if item.review and item.review.status == SubmissionReviewStatus.REJECTED]
        for review in fail_reviews:
            review.active = False
            session.add(review)

    @classmethod
    def start_review(cls, package_id, _session=None):
        """Start the review process for the package."""
        package = cls._get_and_validate_package_for_starting_review(package_id)

        if _session is None:
            with session_scope() as session:
                cls.start_review_process(package, package_id, session)
        else:
            cls.start_review_process(package, package_id, _session)

        return package

    @classmethod
    def start_review_process(cls, package, package_id, session):
        """Common logic for starting the review process."""
        review_item = cls._get_review_item(package)
        if not review_item:
            current_app.logger.info(f"Review form not found in package {package_id}")
            raise BadRequestError("Review form not found in package")
        if review_item.status != ItemStatus.SUBMITTED:
            current_app.logger.info(f"Review form in package {package_id} is not submitted")
            return
        item_data = {
            'status': ItemStatus.UNDER_REVIEW.value,
            'review_start_date': datetime.utcnow().isoformat()
        }
        cls._update_review_item(review_item, item_data, session)
        cls._update_package_status(package_id, session, package)
        new_metadata = {
            PackageMetadataFields.REVIEW_START_DATE.value: item_data.get('review_start_date')
        }
        cls._update_package_metadata(session, package_id, new_metadata)
        cls._log_activity_start_review(package, session)

    @staticmethod
    def _get_review_item(package):
        """Get the review item from the package."""
        if package.type.name == PackageTypeEnum.IEM.value:
            return next((item for item in package.items
                         if item.type.name == SubmissionItemType.IEM.value), None)
        if package.type.name == PackageTypeEnum.MANAGEMENT_PLAN.value:
            return next((item for item in package.items
                         if item.type.name == SubmissionItemType.MANAGEMENT_PLAN_FORM.value), None)
        raise BadRequestError("Unsupported package type")

    @staticmethod
    def _log_activity_start_review(package, session):
        """Log activity for starting management plan review."""
        review_action_map = {
            PackageTypeEnum.IEM.value: ActivityActionType.START_IEM_REVIEW.value,
            PackageTypeEnum.MANAGEMENT_PLAN.value: ActivityActionType.START_MP_REVIEW.value
        }
        action = review_action_map.get(package.type.name)
        if not action:
            raise BadRequestError("Unsupported package type for review")
        ActivityLogService.log_activity(
            entity_id=package.version.original_package_id,
            action=action,
            entity_version=package.version.version,
            session=session
        )

    @classmethod
    def start_cr_check(cls, package_id):
        """Start the consultation check process for the package."""
        package = cls._get_and_validate_package_for_starting_review(package_id)
        item_data = {
            'status': ItemStatus.UNDER_CONSULTATION_CHECK.value,
            'review_start_date': datetime.utcnow().isoformat()
        }
        with session_scope() as session:
            cls._update_cr_status(
                package.items, item_data, session)
            cls._update_package_status(package_id, session, package)
            new_metadata = {
                PackageMetadataFields.CONSULTATION_CHECK_START_DATE.value: item_data.get('review_start_date')
            }
            cls._update_package_metadata(session, package_id, new_metadata)
            cls._log_activity_start_consultation_check(package, session)
            session.flush()
            session.commit()
            return package

    @staticmethod
    def _log_activity_start_consultation_check(package, session):
        """Log activity for starting consultation check."""
        ActivityLogService.log_activity(
            entity_id=package.version.original_package_id,
            action=ActivityActionType.START_CONSULTATION_CHECK.value,
            entity_version=package.version.version,
            session=session
        )

    @staticmethod
    def _unsupported_status(*args, **kwargs):
        """Handle unsupported status."""
        raise BadRequestError("Status is not supported.")

    @staticmethod
    def _create_email_queue_record(package, session):
        """Create email queue records for proponent and staff."""
        current_app.logger.info(f"Creating email queue records for package {package.id}")

        # Email to the submitter (Proponent)
        email_to_proponent = EmailQueueModel(
            entity_id=package.id,
            entity_type=EntityType.PACKAGE.value,
            template_name=MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE
        )
        session.add(email_to_proponent)

        # Email to the staff
        email_to_staff = EmailQueueModel(
            entity_id=package.id,
            entity_type=EntityType.PACKAGE.value,
            template_name=MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE
        )
        session.add(email_to_staff)

        current_app.logger.info(f"Email queue records created for package {package.id}")

    @classmethod
    def _get_state_updater(cls, status) -> callable:
        """Retrieve the appropriate state updater function based on status."""
        state_updaters = defaultdict(
            lambda: cls._unsupported_status,
            {
                PackageStatus.SUBMITTED.value: cls.submit_package,
                PackageStatus.UNDER_REVIEW.value: cls.start_review,
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
        cls._log_activity_update_request(package)
        cls._update_request_creation_email_queue(package.id)
        return package

    @classmethod
    def _create_update_request(cls, package, request_data):
        """Create an update request for the package."""
        update_request = UpdateRequestModel(
            submission_package_id=package.id,
            submission_item_types=request_data.get("submission_item_types"),
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

    @staticmethod
    def _log_activity_update_request(package):
        """Log activity for update request creation."""
        ActivityLogService.log_activity(
            entity_id=package.version.original_package_id,
            action=ActivityActionType.UPDATE_REQUESTED.value,
            entity_version=package.version.version,
        )

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
        if package.completed_on:
            raise BadRequestError(
                "Cannot create a review for a package that has been completed")
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
    def _validate_account_user(cls):
        """Validate the account user."""
        auth_guid = TokenInfo.get_id()
        user = User.get_by_guid(auth_guid)
        if not user or not user.type == UserType.PROPONENT:
            raise BadRequestError("User is not an account user")

    @classmethod
    def _validate_create_update_request_note(cls, package_id, update_request):
        """Validate the creation of an update request note."""
        if not update_request:
            raise ResourceNotFoundError("Update request not found")
        if update_request.submission_package_id != package_id:
            raise BadRequestError("Update request does not belong to the specified package")
        if update_request.note:
            raise BadRequestError("Note already exists for the update request")
        if not update_request.active:
            raise BadRequestError("Update request is not active")
        cls._validate_account_user()
