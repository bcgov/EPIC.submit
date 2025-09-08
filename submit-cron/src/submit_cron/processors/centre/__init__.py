# processors/centre/__init__.py
from typing import Dict, Callable

from submit_api.data_classes.email_details import EmailDetails

from .access_request_received_dst import process_access_request_received_dst
from .access_request_submitted import process_access_request_submitted
from ...models.email_job import EmailJob

# Template names (export as constants, so they’re used consistently)
TEMPLATE_ACCESS_REQUEST_SUBMITTED = "access_request_submitted_confirmation.html"
ACCESS_REQUEST_RECEIVED_NOTIFICATION = 'access_request_received_notification.html'

# Map: template_name -> processor function
# Each processor takes (job: EmailJob) and returns EmailDetails
PROCESSORS: Dict[str, Callable[[EmailJob], EmailDetails]] = {
    TEMPLATE_ACCESS_REQUEST_SUBMITTED: process_access_request_submitted,
    ACCESS_REQUEST_RECEIVED_NOTIFICATION: process_access_request_received_dst,
}

__all__ = [
    "TEMPLATE_ACCESS_REQUEST_SUBMITTED",
    "PROCESSORS",
    "process_access_request_submitted",
    "process_access_request_received_dst",
]
