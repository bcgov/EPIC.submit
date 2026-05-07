"""Project schema.

This module defines the schema for the project entity.
"""
from datetime import datetime

from marshmallow import EXCLUDE, Schema, fields

from submit_api.schemas.package import PackageSchema, StaffPackageSchema
from submit_api.schemas.proponent import ProponentSchema
from submit_api.schemas.account_project_work import AccountProjectWorkSchema
from submit_api.schemas.track_work import TrackWorkSchema


class ProjectSchema(Schema):
    """project schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    proponent_id = fields.Int(data_key="proponent_id")
    proponent = fields.Nested(ProponentSchema, data_key="proponent", allow_none=True)
    ea_certificate = fields.Str(data_key="ea_certificate")
    epic_guid = fields.Str(data_key="epic_guid")
    has_approved_condition = fields.Boolean(data_key="has_approved_condition")
    works = fields.List(fields.Nested(TrackWorkSchema, data_key="works"))


class AddProjectSchema(Schema):
    """add project schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    project_ids = fields.List(fields.Int(), data_key="project_ids")


class AccountProjectPackageSchema(PackageSchema):
    """Account project package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    items = fields.Function(lambda obj: [])


class AccountProjectSchema(Schema):
    """Account project schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    account_id = fields.Int(data_key="account_id")
    project_id = fields.Int(data_key="project_id")
    project = fields.Nested(ProjectSchema, data_key="project")
    latest_packages = fields.List(fields.Nested(AccountProjectPackageSchema), data_key="packages")
    account_project_works = fields.List(fields.Nested(AccountProjectWorkSchema, data_key="account_project_works"))


class StaffAccountProjectPackageSchema(StaffPackageSchema):
    """Account project package schema for staff."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    days_since_submission = fields.Method('get_days_since_submission')
    meta = fields.Method('get_meta')
    items = fields.Function(lambda obj: [])

    def get_days_since_submission(self, obj):
        """Get days since submission."""
        if obj.submitted_on:
            days_since = (datetime.now().date() - obj.submitted_on.date()).days
            return max(days_since, 0)
        return None

    def get_meta(self, obj):
        """Get meta."""
        return obj.meta.json if obj.meta else None


class StaffAccountProjectSchema(AccountProjectSchema):
    """Account project schema for staff."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    latest_packages = fields.List(fields.Nested(StaffAccountProjectPackageSchema), data_key="packages")
