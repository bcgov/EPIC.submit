"""Consultation record review service."""
from datetime import datetime

from flask import current_app

from submit_api.enums.activity_type import ActivityActionType
from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import UnprocessableEntityError, ResourceNotFoundError
from submit_api.models import Item as ItemModel, PackageVersion, UpdateRequest
from submit_api.models import Package as PackageModel
from submit_api.models import PackageMetadata, SubmissionReviewEntry
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.submission import SubmissionStatus, SubmissionType
from submit_api.models.submission_review import SubmissionReview
from submit_api.models.submission_review_entry import SubmissionReviewEntryType
from submit_api.models.update_request import UpdateRequestType
from submit_api.schemas.submission import CreateSubmissionRequestSchema
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.services.package import PackageService
from submit_api.services.submission import SubmissionService
from submit_api.utils.token_info import TokenInfo


class ConsultationRecordService:
    """Consultation record review service."""

    @staticmethod
    def _update_item_submissions_status(status, session, item=None, item_id=None):
        """Update the status of the package based on the statuses of its items."""
        if not item_id and not item:
            current_app.logger.error("Item ID or item is required.")
            raise UnprocessableEntityError("Item ID or item is required.")
        if not item:
            item = ItemModel.find_by_id(item_id)
        submissions = item.submissions
        for submission in submissions:
            submission.status = status
            session.add(submission)
        current_app.logger.info(f"Submissions status updated for item ID: {item_id} to {status}")

    @classmethod
    def approve_consultation_record(cls, item, session):
        """Approve consultation record."""
        item.status = ItemStatus.PASSED_CONSULTATION_CHECK.value
        reviewed_on = datetime.utcnow()
        item.reviewed_on = reviewed_on
        package_metadata = PackageMetadata.get_by_package_id(item.package_id)
        if not package_metadata:
            package_metadata = PackageMetadata(package_id=item.package_id, json={})
        existing_json = package_metadata.json if package_metadata.json else {}
        package_metadata.json = {
            **existing_json,
            PackageMetadataFields.CONSULTATION_CHECK_COMPLETED_ON.value: reviewed_on.isoformat(),
        }
        session.add(item)
        session.add(package_metadata)
        cls._log_activity_consultation_check(item, session, success=True)
        current_app.logger.info(f"Consultation record approved for item {item.id}.")

        current_app.logger.info(f"Starting MP review for package {item.package_id}.")
        PackageService.start_mp_review(item.package_id, session)
        current_app.logger.info(f"MP review started for package {item.package_id}.")

        return item

    @staticmethod
    def _log_activity_consultation_check(item, session, success=True):
        """Log activity for passing or failing the consultation check."""
        action_type = (
            ActivityActionType.PASSED_CONSULTATION_CHECK.value
            if success else
            ActivityActionType.FAILED_CONSULTATION_CHECK.value
        )

        ActivityLogService.log_activity(
            entity_id=item.id,
            action=action_type,
            entity_version=item.package.version_id,
            actor_id= TokenInfo.get_id(),
            session=session
        )

    @classmethod
    def reject_consultation_record(cls, item, session):
        """Reject consultation record."""
        cls._update_submissions_status(item, SubmissionStatus.REJECTED, session)
        update_request_data = cls._prepare_update_request_data(item)
        cls._create_update_request(update_request_data, session)
        cls._log_activity_consultation_check(item, session, success=False)
        session.flush()
        return item

    @classmethod
    def _update_submissions_status(cls, item, status, session):
        """Update the status of submissions."""
        for submission in item.submissions:
            submission.status = status
            session.add(submission)

    @classmethod
    def _prepare_update_request_data(cls, item):
        """Prepare the update request data."""
        item_review = SubmissionReview.get_active_review_by_item_id(item.id)
        manager_review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(
            item_review.id, SubmissionReviewEntryType.MANAGER_CONFIRMATION
        )
        return {
            'package_id': item.package_id,
            'item_ids': manager_review_entry.entry.get('submission_item_ids') if manager_review_entry else None,
            'reason': manager_review_entry.entry.get('reason') if manager_review_entry else None,
            'type': UpdateRequestType.REVIEW,
        }

    @classmethod
    def reject_management_plan_form(cls, item, session):
        """Reject management plan form."""
        cls._update_item_status_mp_rejection(item)
        cls._update_package_metadata_mp_rejection(item, session)
        new_package, new_item = cls._create_new_package_version(item, session)
        update_request_data = {
            'package_id': new_package.id,
            'item_ids': [new_item.id],
            'reason': 'Revision required for the Management Plan.',
            'type': UpdateRequestType.REVIEW,
        }
        cls._create_update_request(update_request_data, session)
        current_app.logger.info(f"Management plan form rejected for item {item.id}.")
        return item

    @classmethod
    def _update_item_status_mp_rejection(cls, item):
        """Update the status and review date of the item for rejection."""
        current_app.logger.info(f"Rejecting management plan form for item {item.id}.")
        item.status = ItemStatus.REVIEW_REJECTED.value
        reviewed_on = datetime.utcnow()
        item.reviewed_on = reviewed_on
        current_app.logger.info(f"Management plan form rejected for item {item.id}.")

    @classmethod
    def _update_package_metadata_mp_rejection(cls, item, session):
        """Update package metadata with review completion date for rejection."""
        current_app.logger.info(f"Updating package metadata for package {item.package_id}.")
        package_metadata = cls._get_or_create_package_metadata_mp_rejection(item.package_id)
        reviewed_on = item.reviewed_on
        existing_json = package_metadata.json if package_metadata.json else {}
        package_metadata.json = {
            **existing_json,
            PackageMetadataFields.REVIEW_COMPLETED_ON.value: reviewed_on.isoformat(),
        }

        session.add(item)
        session.add(package_metadata)
        session.flush()
        current_app.logger.info(f"Package metadata updated for package {item.package_id}.")

    @classmethod
    def _get_or_create_package_metadata_mp_rejection(cls, package_id):
        """Retrieve or create package metadata for rejection."""
        current_app.logger.info(f"Retrieving package metadata for package {package_id}.")
        package_metadata = PackageMetadata.get_by_package_id(package_id)
        if not package_metadata:
            current_app.logger.info(f"Creating package metadata for package {package_id}.")
            package_metadata = PackageMetadata(package_id=package_id, json={})
        return package_metadata

    @classmethod
    def _create_new_package_version(cls, item, session):
        """Create a new package version and retrieve new management plan item for rejection."""
        current_app.logger.info(f"Creating new package version for item {item.id}.")
        package = PackageModel.find_by_id(item.package_id)
        package_version = PackageVersion.get_by_id(package.version_id)
        if not package_version:
            current_app.logger.error(f"Package version not found for item {item.id}.")
            raise ResourceNotFoundError(f"Package version not found for item {item.id}.")
        new_package = PackageService.create_new_package_from_original(package.id, session)
        cls._copy_contact_information_from_old_version(package, new_package)
        current_app.logger.info(f"New package version created for item {item.id}.")
        new_items = new_package.items
        new_item = next((i for i in new_items if i.type.name == item.type.name), None)
        if not new_item:
            current_app.logger.error(f"{item.type.name} item not found in new package {new_package.id}.")
            raise ResourceNotFoundError(f"{item.type.name} item not found in new package {new_package.id}.")
        session.add(new_package)
        session.flush()
        current_app.logger.info(f"New package version created for {new_package.name}.")
        return new_package, new_item

    @classmethod
    def _copy_contact_information_from_old_version(cls, old_package, new_package):
        """Copy contact information from old version."""
        current_app.logger.info("Copying contact information from old version.")
        old_contact_info_item = next((item for item in old_package.items
                                      if item.type.name == SubmissionItemType.CONTACT_INFORMATION.value), None)
        new_contact_info_item = next((item for item in new_package.items
                                      if item.type.name == SubmissionItemType.CONTACT_INFORMATION.value), None)
        old_submission = next((submission for submission in old_contact_info_item.submissions
                               if submission.type == SubmissionType.FORM), None)
        if not old_submission or not old_submission.submitted_form:
            current_app.logger.error("Old contact information form not found and could not be copied.")
        new_submission_data = {
            'type': SubmissionType.FORM.value,
            'item_id': new_contact_info_item.id,
            'data': old_submission.submitted_form.submission_json,
            'created_by': old_submission.created_by,
        }
        new_submission_schema = CreateSubmissionRequestSchema().load(new_submission_data)
        new_submission = SubmissionService.create_submission(new_contact_info_item.id, new_submission_schema)
        new_submission.created_by = old_submission.created_by
        current_app.logger.info("Contact information form copied from old version.")

    @classmethod
    def _create_update_request(cls, data, session):
        """Create an update request."""
        current_app.logger.info(f"Creating update request for new package {data.get('package_id')}.")
        update_request = UpdateRequest(
            submission_package_id=data.get('package_id'),
            submission_item_ids=data.get('item_ids'),
            created_by=TokenInfo.get_id(),
            reason=data.get('reason'),
            type=data.get('type')
        )
        session.add(update_request)
        current_app.logger.info(f"Update request created for new package {data.get('package_id')}.")
