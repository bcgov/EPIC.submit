"""Proponent schema.

This module defines the schema for the project entity.
"""

from marshmallow import EXCLUDE, Schema, fields


class ProponentSchema(Schema):
    """project schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id", attribute="proponent_id")
    name = fields.Str(data_key="name", attribute="proponent_name")
