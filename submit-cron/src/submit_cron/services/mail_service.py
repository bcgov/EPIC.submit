from datetime import datetime

from submit_api.models.project import  Project
from submit_cron.models import db


class EmailService:  # pylint: disable=too-few-public-methods
    """Mail on updates."""

    @staticmethod
    def _send_email():
        count = db.session.query(Project).count()
        print(f"Total records in EmailQueue: {count}")

        # Optionally, fetch a sample record to verify
        sample_record:Project = db.session.query(Project).first()
        if sample_record:
            print(f"Sample record from EmailQueue: {sample_record}")
        else:
            print("No records found in EmailQueue.")

        print(sample_record.name)