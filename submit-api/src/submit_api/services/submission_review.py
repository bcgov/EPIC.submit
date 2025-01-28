"""Submission review management service."""
from collections import defaultdict
from datetime import datetime

from flask import current_app

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import UnprocessableEntityError, ResourceNotFoundError
from submit_api.models import Item as ItemModel, PackageVersion, UpdateRequest
from submit_api.models import Package as PackageModel
from submit_api.models import PackageMetadata, SubmissionReviewEntry
from submit_api.models.db import session_scope
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.queries.package import PackageQueries
from submit_api.models.submission import SubmissionStatus
from submit_api.models.submission_review import SubmissionReview, SubmissionReviewStatus
from submit_api.models.submission_review_entry import SubmissionReviewEntryType
from submit_api.models.update_request import UpdateRequestType
from submit_api.services.package import PackageService
from submit_api.utils.token_info import TokenInfo


class SubmissionReviewService:
    """Submission review management service."""

    @staticmethod
    def _unsupported_submission_item_type(*args, **kwargs):  # pylint: disable=unused-argument
        """Unset submission item type."""
        current_app.logger.error("Attempted to use an unsupported item type.")
        raise UnprocessableEntityError("Item type is not supported.")

    @staticmethod
    def _unsupported_submission_review_status(*args, **kwargs):  # pylint: disable=unused-argument
        """Unset submission item review status."""
        current_app.logger.error("Attempted to use an unsupported review status.")
        raise UnprocessableEntityError("Status is not supported.")

    @staticmethod
    def _update_package_status(package_id, session):
        """Update the status of the package based on the statuses of its items."""
        PackageQueries.update_package_status(package_id, session)
        current_app.logger.info(f"Package status updated for package ID: {package_id}")

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
    def _get_submission_item_by_id(cls, item_id) -> ItemModel:
        """Get item by id."""
        item = ItemModel.find_by_id(item_id)
        if not item:
            current_app.logger.warning(f"Item with id {item_id} not found.")
            raise ResourceNotFoundError(f"Item with id {item_id} not found.")
        return item

    @classmethod
    def get_or_create_active_item_review(cls, item_id) -> SubmissionReview:
        """Get item by id."""
        _ = cls._get_submission_item_by_id(item_id)
        review = SubmissionReview.get_active_review_by_item_id(item_id)
        if not review:
            review = SubmissionReview(item_id=item_id)
        current_app.logger.debug(f"Active item review for item {item_id}: {review}")
        return review

    @classmethod
    def get_or_create_active_item_review_entry(cls, review_id, entry_type) -> SubmissionReview:
        """Get or create item review entry."""
        if entry_type not in SubmissionReviewEntryType.__members__:
            current_app.logger.error(f"Unsupported review entry type: {entry_type}")
            raise UnprocessableEntityError("Review entry type is not supported.")
        review_entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(review_id, entry_type)
        if not review_entry:
            review_entry = SubmissionReviewEntry(review_id=review_id, type=entry_type)
        return review_entry

    @classmethod
    def _save_submission_review_answers(cls, review, review_data, session):
        """Save submission item review answers."""
        review_type = review_data.get('type')
        if not review_type:
            current_app.logger.error("Review type is required.")
            raise UnprocessableEntityError("Review type is required.")

        form_answers = review_data.get('form_answers', {})
        review_entry = cls.get_or_create_active_item_review_entry(review.id, review_type)
        review_entry.entry = form_answers
        review_entry.updated_by = TokenInfo.get_id()
        session.add(review_entry)
        session.flush()
        current_app.logger.debug(f"Submission review answers saved for review {review.id}.")
        return review

    @classmethod
    def process_review_status(cls, review, status, session):
        """Process review status."""
        if not status:
            return review
        if status not in SubmissionReviewStatus.__members__:
            current_app.logger.error(f"Unsupported review status: {status}")
            raise UnprocessableEntityError("Status is not supported.")
        review.status = status
        cls.submission_item_post_review(review, session)
        current_app.logger.info(f"Review status processed for review {review.id}: {status}")
        return review

    @classmethod
    def submission_item_post_review(cls, review, session):
        """Post review of submission item."""
        if review.status == SubmissionReviewStatus.APPROVED.value:
            cls.approve_submission(review.item_id, session)
        elif review.status == SubmissionReviewStatus.REJECTED.value:
            cls.reject_submission(review.item_id, session)

    @classmethod
    def save_submission_review(cls, item_id, review_data):
        """Save submission item review."""
        with session_scope() as session:
            review = cls.get_or_create_active_item_review(item_id)
            review.flush()
            item = ItemModel.find_by_id(item_id)
            package = PackageModel.find_by_id(item.package_id)
            if not package.submitted_on:
                current_app.logger.error(f"Package {package.id} has not been submitted.")
                raise UnprocessableEntityError("Package has not been submitted.")

            if review.status == SubmissionReviewStatus.APPROVED:
                current_app.logger.error(f"Item {item_id} already approved.")
                raise UnprocessableEntityError("Item has already been approved.")
            cls._save_submission_review_answers(review, review_data, session)
            status = review_data.get('status')
            cls.process_review_status(review, status, session)
            session.add(review)
            current_app.logger.info(f"Submission review saved for item {item_id}.")
            return review

    @classmethod
    def _get_submission_item_approval_processor(cls, item: ItemModel) -> callable:
        """Get submission item approval processor."""
        item_type = item.type.name
        status_processor_map = defaultdict(
            lambda: cls._unsupported_submission_item_type,
            {
                SubmissionItemType.CONSULTATION_RECORD.value: cls.approve_consultation_record,
            }
        )
        current_app.logger.debug(f"Approval processor retrieved for item {item.id} of type {item_type}")
        return status_processor_map[item_type]

    @classmethod
    def approve_submission(cls, item_id, session):
        """Approve submission."""
        item = cls._get_submission_item_by_id(item_id)
        approval_processor = cls._get_submission_item_approval_processor(item)
        approval_processor(item, session)
        cls._update_package_status(item.package_id, session)
        cls._update_item_submissions_status(SubmissionStatus.APPROVED, session, item=item)
        current_app.logger.info(f"Submission item {item.id} approved.")
        return item

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
        current_app.logger.info(f"Consultation record approved for item {item.id}.")

        current_app.logger.info(f"Starting MP review for package {item.package_id}.")
        PackageService.start_mp_review(item.package_id, session)
        current_app.logger.info(f"MP review started for package {item.package_id}.")

        return item

    @classmethod
    def reject_submission(cls, item_id, session):
        """Reject submission item."""
        item = ItemModel.find_by_id(item_id)
        rejection_processor = cls._get_submission_item_rejection_processor(item)
        rejection_processor(item, session)
        cls._update_package_status(item.package_id, session)
        cls._update_item_submissions_status(SubmissionStatus.REJECTED, session, item=item)
        current_app.logger.info(f"Submission item {item.id} rejected.")
        return item

    @classmethod
    def _get_submission_item_rejection_processor(cls, item: ItemModel) -> callable:
        """Get submission item rejection processor."""
        item_type = item.type.name
        status_processor_map = defaultdict(
            lambda: cls._unsupported_submission_item_type,
            {
                SubmissionItemType.MANAGEMENT_PLAN_FORM.value: cls.reject_management_plan_form,
                SubmissionItemType.CONSULTATION_RECORD.value: cls.reject_consultation_record,
            }
        )
        current_app.logger.debug(f"Rejection processor retrieved for item {item.id} of type {item_type}")
        return status_processor_map[item_type]

    @classmethod
    def reject_consultation_record(cls, item, session):
        """Reject consultation record."""
        cls._update_submissions_status(item, SubmissionStatus.REJECTED, session)
        update_request_data = cls._prepare_update_request_data(item)
        cls._create_update_request(update_request_data, session)
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
        current_app.logger.info(f"New package version created for item {item.id}.")
        new_items = new_package.items
        new_item = next((i for i in new_items if i.type.name == item.type.name), None)
        if not new_item:
            current_app.logger.error(f"{item.type.name} item not found in new package {new_package.id}.")
            raise ResourceNotFoundError(f"{item.type.name} item not found in new package {new_package.id}.")
        new_package.status = []
        session.add(new_package)
        session.flush()
        current_app.logger.info(f"New package version created for {new_package.name}.")
        return new_package, new_item

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
