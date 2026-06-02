"""Package type model class.

Manages the package type
"""

from marshmallow import EXCLUDE, Schema, fields
from submit_api.enums.package_type import PackageApprovalType


class PackageTypeSchema(Schema):
    """package type schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    title = fields.Str(data_key="title", required=False)
    versioning_enabled = fields.Bool(data_key="versioning_enabled")
    success_message = fields.Str(data_key="success_message", required=False)
    mandatory = fields.Bool(data_key="mandatory")
    approval_type = fields.Enum(data_key="approval_type", enum=PackageApprovalType, required=False)
