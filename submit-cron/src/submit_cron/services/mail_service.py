from datetime import datetime

from submit_api.models.email_queue import  EmailQueue


class EmailService:  # pylint: disable=too-few-public-methods
    """Mail on updates."""

    @staticmethod
    def _send_email():
        print('Starting Email Sending At ', datetime.now())
        mails = EmailQueue.find_all()
        print('mails', mails)
