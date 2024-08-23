"""Package type model class.

Manages the package type
"""

from marshmallow import EXCLUDE, Schema, fields


class PackageTypeSchema(Schema):
    """package type schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
