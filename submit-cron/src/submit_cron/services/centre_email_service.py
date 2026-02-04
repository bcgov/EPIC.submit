import logging
from typing import Callable, Dict

from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError

from submit_cron.models.email_job import EmailJob
from submit_cron.repositories.email_repository import EmailRepository
from submit_cron.services.ches_service import ChesApiService


logger = logging.getLogger(__name__)


class CentreEmailService:
    """Email service for Centre system, decoupled from submit_api models."""

    _processors: Dict[str, Callable[[EmailJob], EmailDetails]] = {}

    @classmethod
    def register_processor(cls, template_name: str, processor: Callable[[EmailJob], EmailDetails]):
        """Register a template-specific processor function."""
        cls._processors[template_name] = processor

    @classmethod
    def process_email_queue(cls, repository: EmailRepository, limit: int = 100):
        """Fetch and process pending emails using a repository."""
        pending = repository.find_pending(limit=limit)
        if not pending:
            logger.info("No pending emails found.")
            return

        logger.info("Processing %d pending emails", len(pending))

        for job in pending:
            try:
                processor = cls._get_processor(job)
                email_details = processor(job)
                cls.send_email(email_details)
                repository.mark_sent(job.id)
            except Exception as e:
                logger.error("Error processing email %s: %s", job.id, e, exc_info=True)
                repository.mark_failed(job.id, str(e))

    @classmethod
    def _get_processor(cls, job: EmailJob) -> Callable[[EmailJob], EmailDetails]:
        if job.template_name not in cls._processors:
            raise BadRequestError(f"Unsupported email template: {job.template_name}")
        return cls._processors[job.template_name]

    @staticmethod
    def send_email(email_details: EmailDetails):
        """Send email via CHES."""
        try:
            ches = ChesApiService()
            return ches.send_email(email_details, template_sub_directory='centre')
        except Exception as e:
            logger.error("Failed to send email: %s", e, exc_info=True)
            raise BadRequestError(f"Failed to send email")
