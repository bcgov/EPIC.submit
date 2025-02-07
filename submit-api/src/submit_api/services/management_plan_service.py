"""management plan review service."""
from datetime import datetime

from flask import current_app

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import PackageVersion
from submit_api.models import Package as PackageModel
from submit_api.models import PackageMetadata
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.submission import SubmissionType
from submit_api.models.update_request import UpdateRequestType, UpdateRequest
from submit_api.schemas.submission import CreateSubmissionRequestSchema
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
        update_request_data = {
            'package_id': new_package.id,
            'item_ids': [new_item.id],
            'reason': 'Revision required for the Management Plan.',
            'type': UpdateRequestType.REVIEW,
        }
        cls._create_mp_update_request(update_request_data, session)
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
    def _create_mp_update_request(cls, data, session):
        """Create an update request."""
        current_app.logger.info(f"Creating update request for new management plan {data.get('package_id')}.")
        update_request = UpdateRequest(
            submission_package_id=data.get('package_id'),
            submission_item_ids=data.get('item_ids'),
            created_by=TokenInfo.get_id(),
            reason=data.get('reason'),
            type=data.get('type')
        )
        session.add(update_request)
        current_app.logger.info(f"Update request created for new management plan {data.get('package_id')}.")
