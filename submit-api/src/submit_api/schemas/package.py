"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields, pre_dump

from submit_api.models.package import PackageStatus
from submit_api.schemas.internal_staff_document import InternalStaffDocument
from submit_api.schemas.item import ItemSchema
from submit_api.schemas.package_type import PackageTypeSchema


class PostPackageRequestSchema(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    name = fields.Str(data_key="name")
    metadata = fields.Dict(data_key="metadata")
    type = fields.Str(data_key="type")


class PostPackageState(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    status = fields.Str(data_key="status")


class PackageSchema(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    account_project_id = fields.Int(data_key="account_project_id")
    name = fields.Str(data_key="name")
    type = fields.Nested(PackageTypeSchema, data_key="type")
    type_id = fields.Int(data_key="type_id")
    status = fields.List(fields.Enum(enum=PackageStatus), enum=PackageStatus, data_key="status")
    submitted_on = fields.DateTime(data_key="submitted_on")
    submitted_by = fields.Str(data_key="submitted_by")
    meta = fields.Method('get_meta')
    items = fields.Nested(ItemSchema, data_key="items", many=True)

    def get_meta(self, obj):
        """Get meta."""
        return obj.meta.package_meta if obj.meta else None

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = obj.submitted_by_user.account_user.full_name \
            if obj.submitted_by_user and obj.submitted_by_user.account_user else None
        return obj


class StaffPackageSchema(PackageSchema):
    """staff package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    internal_staff_documents = fields.Nested(InternalStaffDocument, data_key="internal_staff_documents", many=True)
