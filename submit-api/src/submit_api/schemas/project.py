"""Engagement model class.

Manages the engagement
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models.package import PackageStatus
from submit_api.schemas.account_user import AccountUserSchema
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


class AddProjectSchema(Schema):
    """add project schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    project_ids = fields.List(fields.Int(), data_key="project_ids")


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
    submitted_by_account_user = fields.Pluck(AccountUserSchema, "full_name", data_key="submitted_by")
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
    packages = fields.List(fields.Nested(AccountProjectPackageSchema), data_key="packages")
