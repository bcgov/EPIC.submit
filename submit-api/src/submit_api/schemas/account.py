"""Engagement model class.

Manages the engagement
"""

from marshmallow import EXCLUDE, Schema, fields


class AccountSchema(Schema):
    """Account schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    proponent_id = fields.Int(data_key="proponent_id")


class AccountCreateSchema(Schema):
    """Account schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    first_name = fields.Str(data_key="first_name")
    last_name = fields.Str(data_key="last_name")
    work_email_address = fields.Str(data_key="work_email_address")
    work_contact_number = fields.Str(data_key="work_contact_number")
    position = fields.Str(data_key="position")
    proponent_id = fields.Int(data_key="proponent_id")
    auth_guid = fields.Str(data_key="auth_guid")
    extension_number = fields.Str(data_key="extension_number")
    agreed_terms_of_service_id = fields.Int(data_key="agreed_terms_of_service_id")
    agreed_terms = fields.Bool(data_key="agreed_terms")
