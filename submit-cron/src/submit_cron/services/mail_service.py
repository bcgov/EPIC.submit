from datetime import datetime

from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.package import Package as PackageModel
from submit_api.models.email_queue import EmailQueue

from submit_cron.services.package_submission_email_service import PackageSubmissionEmailService
from submit_cron.services.ches_service import ChesApiService
from submit_cron.models import db


class EmailService:  # pylint: disable=too-few-public-methods
    """Handles the general email sending operations."""

    @staticmethod
    def process_email_queue():
        """Process all pending emails in the email queue."""
        pending_emails = EmailQueue.find_pending()
        for email_entry in pending_emails:
            try:
                if email_entry.entity_type == 'Package_Submission':
                    EmailService._process_package_submission_email(email_entry)
                else:
                    raise BadRequestError(f"Unsupported entity type for email notification: {email_entry.entity_type}")
            except Exception as e:
                # Log the error and update the status to FAILED
                email_entry.status = 'FAILED'
                email_entry.error_message = str(e)
                db.session.commit()

    @staticmethod
    def _process_package_submission_email(email_entry: EmailQueue):
        """Process email entry for package submission."""
        package_id = email_entry.entity_id
        package: PackageModel = db.session.get(PackageModel, package_id)
        if not package:
            raise BadRequestError(f"Package with ID {package_id} not found.")

        # Depending on the package type, prepare the email details
        if package.type.name == 'MANAGEMENT_PLAN':
            email_details = PackageSubmissionEmailService.prepare_package_submission_email_confirmation(package)
        else:
            raise BadRequestError(f"Unsupported package type for email notification: {package.type.name}")

        # Send the email using ChesApiService
        EmailService.send_email(email_details)

        # Update the email queue status to SENT
        email_entry.status = 'SENT'
        email_entry.sent_at = datetime.utcnow()
        db.session.commit()

    @staticmethod
    def send_email(email_details: EmailDetails):
        """Send email using the ChesApiService."""
        try:
            email_api_service = ChesApiService()
            return email_api_service.send_email(email_details)
        except Exception as e:
            raise BadRequestError(f"Failed to send email: {str(e)}")
