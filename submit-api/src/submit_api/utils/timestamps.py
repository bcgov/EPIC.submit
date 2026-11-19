"""UTC normalization for timestamp responses."""
from datetime import UTC, datetime


def normalize_utc(value: datetime) -> datetime:
    """Interpret naive database timestamps as UTC and normalize aware timestamps."""
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
