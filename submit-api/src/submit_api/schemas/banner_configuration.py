"""Banner configuration schema classes.

Manages serialization and request validation for banner configurations.
"""
from marshmallow import EXCLUDE, Schema, fields

from submit_api.enums.banner import BannerType


class BannerConfigurationSchema(Schema):
    """Banner configuration dump schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    banner_type = fields.Enum(BannerType, by_value=True, data_key="banner_type")
    content = fields.Str(data_key="content")
    is_active = fields.Bool(data_key="is_active")
    created_date = fields.DateTime(data_key="created_date")
    updated_date = fields.DateTime(data_key="updated_date")


class BannerConfigurationCreateSchema(Schema):
    """Schema for creating a banner configuration."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    banner_type = fields.Enum(
        BannerType, by_value=True, required=True,
        metadata={"description": "Banner type: Info, Success, Warning, Failure or None"}
    )
    content = fields.Str(
        required=True,
        metadata={"description": "Rich-text HTML content for the banner"}
    )
    is_active = fields.Bool(
        load_default=False,
        metadata={"description": "Whether this banner is the active banner"}
    )


class BannerConfigurationUpdateSchema(Schema):
    """Schema for updating a banner configuration (partial)."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    banner_type = fields.Enum(
        BannerType, by_value=True, required=False,
        metadata={"description": "Banner type: Info, Success, Warning, Failure or None"}
    )
    content = fields.Str(
        required=False,
        metadata={"description": "Rich-text HTML content for the banner"}
    )
    is_active = fields.Bool(
        required=False,
        metadata={"description": "Whether this banner is the active banner"}
    )
