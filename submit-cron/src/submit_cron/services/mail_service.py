from datetime import datetime

from submit_api.models.account import  Account


class EmailService:  # pylint: disable=too-few-public-methods
    """Mail on updates."""

    @staticmethod
    def _send_email():
        print('Starting Email Att*********------------------------', datetime.now())
        mails = Account.find_by_id(1)
        print('mails', mails)
