"""Shared fields for API timestamp responses."""
from marshmallow import fields

from submit_api.utils.timestamps import normalize_utc


class UTCDateTime(fields.DateTime):
    """Serialize UTC database timestamps with an explicit offset, preserving input handling."""

    def _serialize(self, value, attr, obj, **kwargs):
        if value is not None:
            value = normalize_utc(value)
        return super()._serialize(value, attr, obj, **kwargs)
