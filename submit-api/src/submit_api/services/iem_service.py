"""IEM terms of engagement review service."""

from flask import current_app

from submit_api.enums.activity_type import ActivityActionType
from submit_api.enums.management_plan import ManagementPlanSubmissionPurpose
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import Package as PackageModel
from submit_api.services.management_plan_service import ManagementPlanService
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.utils.constants import (
    MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE)


class IEMTermsOfEngagementService:
    """IEM terms of engagement review service."""

    @classmethod
    def reject_iem_form(cls, item, session):
        """Reject iem form."""
        ManagementPlanService.update_item_status_mp_rejection(item)
        ManagementPlanService.update_package_metadata_mp_rejection(item, session)
        _, new_item = ManagementPlanService.create_new_package_version(item, session)
        update_request_data = ManagementPlanService.prepare_update_request_data(new_item, item)
        ManagementPlanService.create_mp_update_request(update_request_data, session)
        cls._log_iem_rejection_activity(item, session)
        ManagementPlanService.deactivate_update_requests(item.package_id, session)
        cls._create_rejection_email_queue(
            item.package_id, MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE)
        current_app.logger.info(
            f"IEM form rejected for item {item.id}.")
        return item

    @classmethod
    def _log_iem_rejection_activity(cls, item, session):
        """Log activity for iem rejection."""
        current_app.logger.info(
            f"Logging activity for iem rejection for package {item.package_id}.")
        package = PackageModel.find_by_id(item.package_id)
        if package.version:
            ActivityLogService.log_activity(
                entity_id=package.version.original_package_id,
                action=ActivityActionType.IEM_REVIEW_FAILED.value,
                entity_version=package.version.version,
                session=session
            )
        current_app.logger.info(
            f"Activity logged for iem rejection for package {package.id}.")

    @classmethod
    def approve_iem(cls, item, session):
        """Approve iem."""
        package = PackageModel.find_by_id(item.package_id)
        ManagementPlanService.update_item_status_mp_approval(item, package, session)
        ManagementPlanService.update_package_for_completion(item, package, session)
        ManagementPlanService.deactivate_update_requests(package.id, session, package)
        cls._log_activity_iem_approval(package, session)
        current_app.logger.info(
            f"IEM plan form approved for item {item.id}.")
        return item

    @classmethod
    def _log_activity_iem_approval(cls, package, session):
        """Log activity for iem approval."""
        current_app.logger.info(
            f"Logging activity for iem approval for package {package.id}.")
        submitted_to_eao_for = ManagementPlanService.get_package_submitted_to_eao_for(package)
        activity_type_condition_map = {
            ManagementPlanSubmissionPurpose.ACCEPTANCE.value: ActivityActionType.IEM_ACCEPTED.value,
            ManagementPlanSubmissionPurpose.APPROVAL.value: ActivityActionType.IEM_APPROVED.value,
            ManagementPlanSubmissionPurpose.SATISFACTION.value: ActivityActionType.IEM_SATISFIED.value,
            ManagementPlanSubmissionPurpose.REVIEW.value: ActivityActionType.IEM_REVIEWED.value,
        }
        action_type = activity_type_condition_map.get(submitted_to_eao_for)
        if not action_type:
            raise ResourceNotFoundError(
                f"Unsupported purpose {submitted_to_eao_for} for package {package.id}.")
        if package.version:
            ActivityLogService.log_activity(
                entity_id=package.version.original_package_id,
                action=action_type,
                entity_version=package.version.version,
                session=session
            )
        current_app.logger.info(
            f"Activity logged for iem approval for package {package.id}.")

    @classmethod
    def _create_rejection_email_queue(cls, package_id, template_name):
        """Create an email queue record for an update request."""
        email_queue = EmailQueueModel(
            entity_id=package_id, entity_type=EntityType.PACKAGE.value,
            template_name=template_name
        )
        email_queue.save()
