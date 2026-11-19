"""Date Submitted predicates shared by the project and document listings."""
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import literal

from submit_api.models.package import Package
from submit_api.utils.constants import BC_TIMEZONE


def _calendar_date(value):
    """Recognize calendar dates while preserving existing timestamp filter inputs."""
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _utc_midnight(day):
    """Express BC midnight as a naive UTC value for Package.submitted_on."""
    return datetime.combine(day, time.min, BC_TIMEZONE).astimezone(UTC).replace(tzinfo=None)


def filter_by_submitted_date(query, start, end):
    """Include both selected BC dates, up to midnight after the end date."""
    if start:
        day = _calendar_date(start)
        query = query.filter(Package.submitted_on >= (_utc_midnight(day) if day else start))
    if end:
        day = _calendar_date(end)
        if day:
            # PostgreSQL can represent the next midnight even for a 9999-12-31 upper bound.
            next_midnight = literal(_utc_midnight(day)) + timedelta(days=1)
            query = query.filter(Package.submitted_on < next_midnight)
        else:
            query = query.filter(Package.submitted_on <= end)
    return query
