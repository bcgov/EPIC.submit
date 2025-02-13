"""management plan review service."""
from datetime import datetime

from flask import current_app

from submit_api.enums.activity_type import ActivityActionType
from submit_api.enums.item_status import ItemStatus
from submit_api.enums.management_plan import ManagementPlanSubmissionPurpose
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import PackageVersion, SubmissionReview, SubmissionReviewEntry
from submit_api.models import Package as PackageModel
from submit_api.models import PackageMetadata
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.submission import SubmissionType
from submit_api.models.submission_review_entry import SubmissionReviewEntryType
from submit_api.models.update_request import UpdateRequestType, UpdateRequest
from submit_api.schemas.submission import CreateSubmissionRequestSchema
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.services.package import PackageService
from submit_api.services.submission import SubmissionService
from submit_api.utils.token_info import TokenInfo


class ManagementPlanService:
    """management plan review service."""

    @classmethod
    def reject_management_plan_form(cls, item, session):
        """Reject management plan form."""
        cls._update_item_status_mp_rejection(item)
        cls._update_package_metadata_mp_rejection(item, session)
        new_package, new_item = cls._create_new_package_version(item, session)
        update_request_data = cls._prepare_update_request_data(new_item, item)
        cls._create_mp_update_request(update_request_data, session)
        cls._log_management_plan_rejection_activity(item, session)
        current_app.logger.info(f"Management plan form rejected for item {item.id}.")
        return item

    @classmethod
    def _prepare_update_request_data(cls, new_item, old_item):
        """Prepare the update request data."""
        item_review = SubmissionReview.get_active_review_by_item_id(old_item.id)
        manager_review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(
            item_review.id, SubmissionReviewEntryType.MANAGER_CONFIRMATION
        )
        return {
            'package_id': new_item.package_id,
            'submission_item_types': manager_review_entry.entry.get('submission_item_types') if manager_review_entry else None,
            'reason': manager_review_entry.entry.get('reason') if manager_review_entry else None,
            'type': UpdateRequestType.REVIEW,
        }

    @classmethod
    def _log_management_plan_rejection_activity(cls, item, session):
        """Log activity for management plan rejection."""
        current_app.logger.info(f"Logging activity for management plan rejection for package {item.package_id}.")
        package = PackageModel.find_by_id(item.package_id)
        ActivityLogService.log_activity(
            entity_id=package.id,
            action=ActivityActionType.MP_REVIEW_FAILED.value,
            entity_version=package.version.version,
            session=session
        )
        current_app.logger.info(f"Activity logged for management plan rejection for package {package.id}.")

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
    def _create_mp_update_request(cls, data, session):
        """Create an update request."""
        current_app.logger.info(f"Creating update request for new management plan {data.get('package_id')}.")
        update_request = UpdateRequest(
            submission_package_id=data.get('package_id'),
            submission_item_types=data.get('submission_item_types'),
            created_by=TokenInfo.get_id(),
            reason=data.get('reason'),
            type=data.get('type')
        )
        session.add(update_request)
        current_app.logger.info(f"Update request created for new management plan {data.get('package_id')}.")

    @classmethod
    def approve_management_plan(cls, item, session):
        """Approve management plan."""
        package = PackageModel.find_by_id(item.package_id)
        cls._update_item_status_mp_approval(item, package, session)
        cls._update_package_for_completion(item, package, session)
        cls._deactivate_update_requests(package, session)
        cls._log_activity_mp_approval(package, session)
        current_app.logger.info(f"Management plan form approved for item {item.id}.")
        return item

    @classmethod
    def _get_package_submitted_to_eao_for(cls, package):
        """Get the condition from the package."""
        current_app.logger.info(f"Retrieving submitted_to_eao_for for package {package.id}.")
        package_metadata = package.meta
        condition = package_metadata.json.get(PackageMetadataFields.CONDITION.value)
        if not condition:
            raise ResourceNotFoundError(f"Condition not found for package {package.id}.")
        attributes = condition.get('condition_attributes')
        if not attributes:
            raise ResourceNotFoundError(f"condition_attributes key not found for package {package.id}.")
        submitted_to_eao_for = attributes.get('submitted_to_eao_for')
        if not submitted_to_eao_for:
            raise ResourceNotFoundError(f"submitted_to_eao_for key not found for package {package.id}.")
        current_app.logger.info(f"Retrieved submitted_to_eao_for for package {package.id}.")
        return submitted_to_eao_for

    @classmethod
    def _update_item_status_mp_approval(cls, item, package, session):
        """Update the status of the item for approval."""
        current_app.logger.info(f"Approving management plan form for item {item.id}.")
        submitted_to_eao_for = cls._get_package_submitted_to_eao_for(package)

        mp_purpose_status_map = {
            ManagementPlanSubmissionPurpose.ACCEPTANCE.value: ItemStatus.ACCEPTED,
            ManagementPlanSubmissionPurpose.APPROVAL.value: ItemStatus.APPROVED,
            ManagementPlanSubmissionPurpose.SATISFACTION.value: ItemStatus.SATISFIED,
        }
        status = mp_purpose_status_map.get(submitted_to_eao_for)
        if not status:
            raise ResourceNotFoundError(f"Unsupported purpose {submitted_to_eao_for} for package {package.id}.")
        item.status = status
        session.add(item)
        session.flush()
        current_app.logger.info(f"Management plan form {status.value} for item {item.id}.")

    @classmethod
    def _update_package_for_completion(cls, item, package, session):
        """Update package for completion."""
        current_app.logger.info(f"Updating package for completion for item {item.id}.")
        package.completed_on = datetime.utcnow()
        session.add(package)
        session.flush()
        current_app.logger.info(f"Package updated for completion for item {item.id}.")

    @classmethod
    def _log_activity_mp_approval(cls, package, session):
        """Log activity for management plan approval."""
        current_app.logger.info(f"Logging activity for management plan approval for package {package.id}.")
        submitted_to_eao_for = cls._get_package_submitted_to_eao_for(package)
        activity_type_condition_map = {
            ManagementPlanSubmissionPurpose.ACCEPTANCE.value: ActivityActionType.MP_ACCEPTED.value,
            ManagementPlanSubmissionPurpose.APPROVAL.value: ActivityActionType.MP_APPROVED.value,
            ManagementPlanSubmissionPurpose.SATISFACTION.value: ActivityActionType.MP_SATISFIED.value,
        }
        action_type = activity_type_condition_map.get(submitted_to_eao_for)
        if not action_type:
            raise ResourceNotFoundError(f"Unsupported purpose {submitted_to_eao_for} for package {package.id}.")
        ActivityLogService.log_activity(
            entity_id=package.id,
            action=action_type,
            entity_version=package.version.version,
            session=session
        )
        current_app.logger.info(f"Activity logged for management plan approval for package {package.id}.")

    @classmethod
    def _deactivate_update_requests(cls, package, session):
        """Deactivate all update requests for the package."""
        current_app.logger.info(f"Deactivating update requests for package {package.id}.")
        update_requests = package.update_requests
        for update_request in update_requests:
            update_request.active = False
            session.add(update_request)
        session.flush()
        current_app.logger.info(f"Update requests deactivated for package {package.id}.")
