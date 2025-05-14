"""Account terms of service schema class.

Manages the account terms of service
"""

from marshmallow import EXCLUDE, Schema, fields


class TermsOfServiceSchema(Schema):
    """Terms of service schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    version = fields.Int(data_key="version")
    content = fields.Str(data_key="content")
    rich_content = fields.Str(data_key="rich_content")
    active = fields.Bool(data_key='active')
