from datetime import datetime
from typing import List

from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.package import Package as PackageModel
from submit_api.models.email_queue import EmailQueue

from submit_cron.services.package_submission_email_service import PackageSubmissionEmailService
from submit_cron.services.ches_service import ChesApiService
from submit_cron.models import db
from submit_cron.utils.constants import MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE


class EmailService:  # pylint: disable=too-few-public-methods
    """Handles the general email sending operations."""

    @staticmethod
    def process_email_queue():
        """Process all pending emails in the email queue."""
        pending_emails = EmailService.find_pending()
        if not pending_emails:
            print("No pending emails found.")
            return
        print(f"Number of pending emails: {len(pending_emails)}")
        for email_entry in pending_emails:
            try:
                if email_entry.entity_type == MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE:
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

        email_details = PackageSubmissionEmailService.prepare_package_submission_email_confirmation(package)

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

    @staticmethod
    def find_pending(limit=100) -> List[EmailQueue]:
        """Find all pending emails in the queue, with a limit for performance.

        Args:
            limit (int): Maximum number of pending emails to return.

        Returns:
            list[EmailQueue]: List of pending email queue entries.
        """
        return db.session.query(EmailQueue).filter(EmailQueue.status == 'PENDING').limit(limit).all()
