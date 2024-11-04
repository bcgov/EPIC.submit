"""Service for package management."""
from collections import defaultdict
from datetime import datetime

from submit_api.data_classes.email_details import EmailDetails
from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import BadRequestError
from submit_api.models import Item as ItemModel
from submit_api.models import Package as PackageModel
from submit_api.models import PackageType as PackageTypeModel
from submit_api.models import Project as ProjectModel
from submit_api.models.db import session_scope
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.package import PackageStatus
from submit_api.models.package_item_type import PackageItemType as PackageItemTypeModel
from submit_api.models.package_metadata import PackageMetadata as PackageMetadataModel
from submit_api.models.queries.package import PackageQueries
from submit_api.models.submission import SubmissionTypeStatus
from submit_api.services.email_service import EmailService
from submit_api.services.package_type import PackageTypeService
from submit_api.utils.constants import MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE
from submit_api.utils.token_info import TokenInfo


class PackageService:
    """Package management service."""

    @classmethod
    def get_package_by_id(cls, package_id):
        """Get package by id."""
        package = PackageModel.get_package_by_id_with_items(package_id)
        return package

    @classmethod
    def create_package(cls, account_project_id, request_data):
        """Create a new package."""
        with session_scope() as session:
            package_type = PackageTypeModel.find_by_name(
                request_data.get("type"))
            package = cls._create_package(
                session, account_project_id, request_data, package_type)
            cls._create_package_metadata(
                session, package.id, request_data.get("metadata"))
            cls._create_items(session, package.id, package_type.id, package_type.item_types)
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
            package_id=package_id, package_meta=metadata
        )
        session.add(package_metadata)

    @staticmethod
    def _create_items(session, package_id, package_type_id, item_types):
        """Create items for the package."""
        package_item_types = session.query(PackageItemTypeModel).filter_by(
            package_type_id=package_type_id,
        ).all()

        item_type_to_package_item_type = {
            pit.item_type_id: pit for pit in package_item_types
        }

        for item_type in item_types:
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
    def _get_and_validate_complete_package(package_id) -> PackageModel:
        """Retrieve and validate that all items in the package are completed."""
        package = PackageModel.find_by_id(package_id)
        if any(item.status.value != ItemStatus.COMPLETED.value for item in package.items):
            raise BadRequestError("All items must be completed before completing the package")
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
    def _update_package_submission_details(package, session):
        """Update package submission details."""
        package.submitted_on = datetime.utcnow()
        package.submitted_by = TokenInfo.get_id()
        session.add(package)

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
    def send_package_submission_email_confirmation(cls, package: PackageModel):
        """Send email confirmation for package submission."""
        submitter = package.submitted_by_account_user
        submitted_by_email = submitter.work_email_address
        sender_email = PackageTypeService.get_email_sender_for_package_type(package.type.name)
        if not sender_email:
            raise BadRequestError("Sender email not found for package type")

        proponent = ProjectModel.get_one_by_proponent_id(submitter.account.proponent_id)
        document_submissions = cls._get_document_submissions_from_package(package)
        email_details = EmailDetails(
            template_name=MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE,
            body_args={
                'submitter_name': submitter.full_name,
                'submission_date': package.submitted_on.strftime('%Y-%m-%d %H:%M:%S'),
                'certificate_holder_name': proponent.proponent_name,
                'package_name': package.name,
                'documents': [submission.submitted_document.name for submission in document_submissions]
            },
            subject=f'Confirmation of receipt for {package.name}',
            sender=sender_email,
            recipients=[submitted_by_email],
        )

        return EmailService().send_email(email_details)

    @classmethod
    def submit_package(cls, package_id):
        """Submit the package by updating its status and items."""
        package = cls._get_and_validate_complete_package(package_id)

        with session_scope() as session:
            cls._update_items_status(package.items, ItemStatus.SUBMITTED.value, session)
            cls._update_package_status(package_id, session, package)
            cls._update_package_submission_details(package, session)
            cls._create_email_queue_record(package, session)
            session.flush()
            session.commit()
        # TODO: Remove this once we have a generic email service
        cls.send_package_submission_email_confirmation(package)
        return package

    @staticmethod
    def _unsupported_status(*args, **kwargs):
        """Handle unsupported status."""
        raise BadRequestError("Status is not supported.")
    
    @staticmethod
    def _create_email_queue_record(package, session):
        """Create an email queue record."""
        email_queue = EmailQueueModel(
            entity_id=package.id, entity_type='PACKAGE', template_name=MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE
        )
        session.add(email_queue)


    @classmethod
    def _get_state_updater(cls, status) -> callable:
        """Retrieve the appropriate state updater function based on status."""
        state_updaters = defaultdict(
            lambda: cls._unsupported_status,
            {
                PackageStatus.SUBMITTED.value: cls.submit_package,
            }
        )
        return state_updaters[status]

    @classmethod
    def update_package_state(cls, package_id, request_data):
        """Update the state of the package based on the provided status."""
        status = request_data.get("status")
        state_updater = cls._get_state_updater(status)
        return state_updater(package_id)
