from typing import Dict, Any, List

from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError

from submit_cron.models.email_job import EmailJob


def _require(payload: Dict[str, Any], fields: List[str]) -> None:
    missing = [f for f in fields if not payload.get(f)]
    if missing:
        raise BadRequestError(f"Missing required payload fields: {', '.join(missing)}")


def process_access_request_submitted(job: EmailJob) -> EmailDetails:
    """
    Processor for the 'access request submitted' template.

    Expected job.payload:
      {
        "recipients": ["user@example.com"],   # required
        "user_name": "Jane Doe",              # required
        "application_name": "EPIC.centre",    # required
        "requested_at": "2025-09-04 10:15 PT",# required (string already formatted)
        "sender": "staff@email.com",          # required (email address)
        "logo_url": "https://..."             # optional
      }
    """
    payload = job.payload or {}
    _require(payload, ["recipients", "user_name", "application_name", "requested_at", "sender"])

    recipients = payload["recipients"]
    if not isinstance(recipients, list) or not recipients:
        raise BadRequestError("payload.recipients must be a non-empty list of email addresses")

    subject = f"Your EPIC Access Request for {payload['application_name']} Has Been Submitted"

    email_details = EmailDetails(
        template_name='access_request_submitted_confirmation.html',
        body_args={
            'user_name': payload['user_name'],
            'application_name': payload['application_name'],
            'current_level': payload['current_level'],
            'requested_at': payload['requested_at'],
        },
        subject=subject,
        sender=payload['sender'],
        recipients=recipients,
    )
    return email_details
