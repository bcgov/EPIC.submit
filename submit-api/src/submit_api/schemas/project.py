"""Engagement model class.

Manages the engagement
"""

from marshmallow import EXCLUDE, Schema, fields


class ProjectSchema(Schema):
    """Account schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    project_id = fields.Str(data_key="project_id")
    account_id = fields.Str(data_key="account_id")
