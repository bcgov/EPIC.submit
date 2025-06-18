"""Service for package version management."""
from flask import current_app

from submit_api.models import Package as PackageModel
from submit_api.models import PackageVersion as PackageVersionModel
from submit_api.models import PackageMetadata as PackageMetadataModel
from submit_api.models import PackageItemType as PackageItemTypeModel
from submit_api.models import Item as ItemModel
from submit_api.models.package_metadata import PackageMetadataFields
from submit_api.models.update_request import UpdateRequestStatus
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.submission import SubmissionType
from submit_api.schemas.submission import CreateSubmissionRequestSchema
from submit_api.services.submission import SubmissionService
from submit_api.exceptions import BadRequestError


class PackageVersionService:
    """Service for managing package versions."""

    @classmethod
    def create_new_package_version(cls, current_package_id, session):
        """Create a new package version."""
        current_app.logger.info(f"Creating a new package version for package {current_package_id}")

        current_package = PackageModel.find_by_id(current_package_id)
        package_version = PackageVersionModel.get_by_id(current_package.version_id)
        all_package_versions = PackageVersionModel.get_all_by_original_package_id(
            package_version.original_package_id)

        if not all_package_versions:
            raise BadRequestError("Cannot create a new version for a package that has no versions")

        latest_version = max(package_version.version for package_version in all_package_versions)
        if latest_version != package_version.version:
            raise BadRequestError("Cannot create a new version for a package that is not the latest version")

        new_version = latest_version + 1
        new_package = cls._create_package(
            session, current_package.account_project_id,
            {"name": current_package.name}, current_package.type)

        new_version = cls._create_package_version(
            session, original_package_id=package_version.original_package_id,
            version=new_version)

        new_package.version_id = new_version.id
        session.add(new_package)

        new_metadata = {
            PackageMetadataFields.CONDITION.value: current_package.meta.json.get(
                PackageMetadataFields.CONDITION.value, None),
            PackageMetadataFields.SUPPORTING_CONDITIONS.value: current_package.meta.json.get(
                PackageMetadataFields.SUPPORTING_CONDITIONS.value, None),
        }
        cls._create_package_metadata(session, new_package.id, new_metadata)

        # Create items
        cls._create_items(session, new_package.id, current_package.type)

        return new_package

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
    def _create_package_version(session, original_package_id, version=1):
        """Create a new package version."""
        package_version = PackageVersionModel(
            original_package_id=original_package_id,
            version=version
        )
        session.add(package_version)
        session.flush()
        return package_version

    @staticmethod
    def _create_package_metadata(session, package_id, metadata):
        """Create package metadata."""
        package_metadata = PackageMetadataModel(
            package_id=package_id, json=metadata
        )
        session.add(package_metadata)

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
            package_item_type = item_type_to_package_item_type.get(item_type.id)
            if package_item_type:
                item = ItemModel(
                    package_id=package_id,
                    type_id=item_type.id,
                    sort_order=package_item_type.sort_order
                )
                session.add(item)
        session.flush()

    @staticmethod
    def copy_contact_information(old_package, new_package):
        """Copy contact information from old version to new version."""
        old_contact_info_item = next(
            (item for item in old_package.items
             if item.type.name == SubmissionItemType.CONTACT_INFORMATION.value),
            None
        )
        new_contact_info_item = next(
            (item for item in new_package.items
             if item.type.name == SubmissionItemType.CONTACT_INFORMATION.value),
            None
        )

        old_submission = next(
            (submission for submission in old_contact_info_item.submissions
             if submission.type == SubmissionType.FORM),
            None
        )

        if not old_submission or not old_submission.submitted_form:
            current_app.logger.error("Old contact information form not found and could not be copied.")
            return

        new_submission_data = {
            'type': SubmissionType.FORM.value,
            'item_id': new_contact_info_item.id,
            'data': old_submission.submitted_form.submission_json,
            'created_by': old_submission.created_by,
        }

        new_submission_schema = CreateSubmissionRequestSchema().load(new_submission_data)
        new_submission = SubmissionService.create_submission(
            new_contact_info_item.id, new_submission_schema)
        new_submission.created_by = old_submission.created_by

    @staticmethod
    def deactivate_update_requests(package_id, session, package=None):
        """Deactivate all update requests for the package."""
        if not package:
            package = PackageModel.find_by_id(package_id)

        update_requests = package.update_requests
        for update_request in update_requests:
            update_request.active = False
            update_request.status = UpdateRequestStatus.CLOSED.value
            session.add(update_request)
        session.flush()

    @staticmethod
    def create_email_queue(package_id, template_name):
        """Create an email queue record."""
        email_queue = EmailQueueModel(
            entity_id=package_id,
            entity_type=EntityType.PACKAGE.value,
            template_name=template_name
        )
        email_queue.save()
