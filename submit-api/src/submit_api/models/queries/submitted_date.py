"""Date Submitted predicates shared by the project and document listings."""
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import literal

from submit_api.models.package import Package
from submit_api.utils.constants import BC_TIMEZONE


def _bc_midnight_in_utc(value: str) -> datetime | None:
    """Convert a date-only filter to UTC. Explicit timestamps keep their existing bounds."""
    try:
        day = date.fromisoformat(value)
    except ValueError:
        return None
    midnight = datetime.combine(day, time.min, BC_TIMEZONE)
    return midnight.astimezone(UTC).replace(tzinfo=None)


def filter_by_submitted_date(query, start, end):
    """Include both selected BC dates, up to midnight after the end date."""
    submitted_on = Package.submitted_on
    if start:
        lower_bound = _bc_midnight_in_utc(start) or start
        query = query.filter(submitted_on >= lower_bound)

    if not end:
        return query

    end_midnight = _bc_midnight_in_utc(end)
    if end_midnight is None:
        return query.filter(submitted_on <= end)

    # Let PostgreSQL add the day so an end date of 9999-12-31 also works.
    next_midnight = literal(end_midnight) + timedelta(days=1)
    return query.filter(submitted_on < next_midnight)
