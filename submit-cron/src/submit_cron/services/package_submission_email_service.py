from datetime import datetime

from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.project import Project as ProjectModel
from submit_api.models.package import Package as PackageModel
from submit_api.models.user import User as UserModel
from submit_api.models.account_user import AccountUser as AccountUserModel
from submit_api.models.submission import SubmissionType

from submit_cron.utils import constants
from submit_cron.models import db
from submit_api.utils.constants import MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE, MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE
from submit_cron.utils.datetime import convert_utc_to_local_str


class PackageSubmissionEmailService:  # pylint: disable=too-few-public-methods
    """Handles sending email notifications for package submissions."""

    @classmethod
    def prepare_package_submission_email_confirmation(cls, package: PackageModel, template_name) -> EmailDetails:
        """Prepare email details for package submission confirmation."""
        submitter = cls._get_submitter(package.submitted_by)
        if not submitter:
            raise BadRequestError(f"Submitter with auth_guid {package.submitted_by} not found")

        sender_email = cls.get_email_sender_for_package_type(package.type.name)

        if not sender_email:
            raise BadRequestError(f"Sender email not found for package type: {package.type.name}")

        proponent = cls._get_proponent(submitter.account.proponent_id)
        if not proponent:
            raise BadRequestError(f"Proponent with ID {submitter.account.proponent_id} not found")

        document_submissions = cls._get_document_submissions_from_package(package)
        email_template_name = template_name or MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE

        if email_template_name == MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE:
            staff_email = current_app.config.get('STAFF_SUPPORT_MAIL_ID')
            if not staff_email:
                raise BadRequestError("STAFF_SUPPORT_MAIL_ID is not configured")

            recipients = [staff_email]
            subject = f"{proponent.proponent_name} submitted {package.name}"
        else:
            recipients = [submitter.work_email_address]
            subject = f"Confirmation of receipt for {package.name}"

        email_details = EmailDetails(
            template_name=email_template_name,
            body_args={
                'submitter_name': submitter.full_name,
                'submission_date': convert_utc_to_local_str(package.submitted_on),
                'certificate_holder_name': proponent.proponent_name,
                'package_name': package.name,
                'documents': [submission.submitted_document.name for submission in document_submissions]
            },
            subject=subject,
            sender=sender_email,
            recipients=recipients,
        )
        print(
            f"Sending email from {email_details.sender} to {', '.join(email_details.recipients)} for package: {email_details.body_args['package_name']}")

        return email_details

    @staticmethod
    def get_email_sender_for_package_type(package_type: str) -> str:
        """Get the email sender for the package type."""
        return constants.SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP.get(package_type, None)

    @staticmethod
    def _get_document_submissions_from_package(package: PackageModel):
        """Retrieve document submissions from the package."""
        submissions = [
            submission for item in package.items for submission in item.submissions
            if submission.type == SubmissionType.DOCUMENT
        ]
        return submissions

    @staticmethod
    def _get_submitter(auth_guid: str) -> AccountUserModel:
        """Retrieve the account user by their auth_guid."""
        return (
            db.session.query(AccountUserModel)
            .join(UserModel)
            .filter(UserModel.auth_guid == auth_guid)
            .first()
        )

    @staticmethod
    def _get_proponent(proponent_id: int) -> ProjectModel:
        """Retrieve the proponent by their ID."""
        return db.session.query(ProjectModel).filter(ProjectModel.proponent_id == proponent_id).first()
