from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.package import Package as PackageModel
from submit_api.utils.constants import MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE


class ResubmissionEmailService:
    """Handles sending email notifications for resubmission requests."""

    @classmethod
    def prepare_resubmission_request_email(cls, package: PackageModel) -> EmailDetails:
        """Prepare email details for resubmission request."""
        if not package.submitted_by_user or not package.submitted_by_user.account_user:
            raise BadRequestError(f"Submitter with auth_guid {package.submitted_by} not found")
        submitter = package.submitted_by_user.account_user

        web_url = current_app.config.get('WEB_URL')
        submission_path = current_app.config.get('SUBMISSION_PATH', 'submissions')
        submission_link = f"{web_url}/{submission_path}/{package.id}"

        email_details = EmailDetails(
            template_name=MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE,
            body_args={
                'submission_link': submission_link,
                'submitter_name': submitter.full_name,
                'package_name': package.name,
            },
            subject=f'Invitation to resubmit a new version of {package.name} in EPIC.submit',
            sender=current_app.config.get('SENDER_EMAIL'),
            recipients=[submitter.work_email_address],
        )

        return email_details
