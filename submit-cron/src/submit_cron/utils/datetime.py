"""Datetime object helper."""

from datetime import datetime

import pytz
from flask import current_app


# Constants
PACIFIC_TZ = pytz.timezone('US/Pacific')
UTC_TZ = pytz.utc


def convert_utc_to_local_str(utc_dt: datetime, dt_format='%Y-%m-%d %I:%M %p %Z', timezone_override=None):
    """
    Convert a  UTC datetime to local timezone and format it.
    """
    utc_dt = pytz.utc.localize(utc_dt)

    tz_name = timezone_override or current_app.config.get('LEGISLATIVE_TIMEZONE', 'US/Pacific')
    local_tz = pytz.timezone(tz_name)
    local_dt = utc_dt.astimezone(local_tz)

    # Step 3: Format
    return local_dt.strftime(dt_format)

