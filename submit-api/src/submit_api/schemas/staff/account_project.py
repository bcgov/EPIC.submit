"""Project schema model class.

Manages the project schema
"""
from datetime import datetime

from marshmallow import EXCLUDE, Schema, fields, pre_dump

from submit_api.models.package import PackageStatus
from submit_api.schemas.package_type import PackageTypeSchema


class ProjectSchema(Schema):
    """project schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    proponent_id = fields.Int(data_key="proponent_id")
    proponent_name = fields.Str(data_key="proponent_name")
    ea_certificate = fields.Str(data_key="ea_certificate")


class AccountProjectPackageSchema(Schema):
    """Account project package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    type = fields.Nested(PackageTypeSchema, data_key="type")
    status = fields.List(fields.Enum(enum=PackageStatus), data_key="status")
    submitted_on = fields.DateTime(data_key="submitted_on")
    submitted_by = fields.Str(data_key="submitted_by")
    items = fields.Function(lambda obj: [])
    days_since_submission = fields.Method('get_days_since_submission')
    meta = fields.Method('get_meta')

    def get_days_since_submission(self, obj):
        """Get days since submission."""
        if obj.submitted_on:
            return (datetime.now() - obj.submitted_on).days
        return None

    def get_meta(self, obj):
        """Get meta."""
        return obj.meta.package_meta if obj.meta else None

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = obj.submitted_by_user.account_user.full_name \
            if obj.submitted_by_user and obj.submitted_by_user.account_user else None
        return obj


class AccountProjectSchema(Schema):
    """Account project schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    account_id = fields.Int(data_key="account_id")
    project_id = fields.Int(data_key="project_id")
    project = fields.Nested(ProjectSchema, data_key="project")
    packages = fields.List(fields.Nested(AccountProjectPackageSchema), data_key="packages")
