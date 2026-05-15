"""Package type creation schema.

Schema for creating or updating package types with phase associations.
"""

from marshmallow import EXCLUDE, Schema, fields, validates_schema, ValidationError, validate


class ItemTypeSchema(Schema):
    """Schema for item type (can be ID or new item type definition)."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(
        required=False,
        data_key="id",
        metadata={"description": "Existing item type ID"}
    )
    name = fields.Str(
        required=False,
        data_key="name",
        metadata={"description": "Name for new item type"}
    )
    description = fields.Str(
        required=False,
        data_key="description",
        metadata={"description": "Description for new item type"}
    )
    submission_method = fields.Str(
        required=False,
        data_key="submission_method",
        validate=validate.OneOf(['FORM_SUBMISSION', 'DOCUMENT_UPLOAD']),
        metadata={"description": "Submission method: FORM_SUBMISSION or DOCUMENT_UPLOAD"}
    )
    is_required = fields.Bool(
        required=False,
        data_key="is_required",
        load_default=True,
        metadata={"description": "Whether this item type is required for the package type"}
    )

    @validates_schema
    def validate_item_type(self, data, **kwargs):
        """Validate that either id is provided OR both name and submission_method."""
        has_id = 'id' in data and data['id'] is not None
        has_name = 'name' in data and data['name']
        has_method = 'submission_method' in data and data['submission_method']

        if has_id and (has_name or has_method):
            raise ValidationError('Provide either id OR (name and submission_method), not both')

        if not has_id and not (has_name and has_method):
            raise ValidationError('Must provide either id OR both name and submission_method')


class PackageTypeCreateSchema(Schema):
    """Schema for creating/updating package types with phase association."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    ea_act_name = fields.Str(
        required=True,
        data_key="ea_act_name",
        metadata={"description": "Environmental Assessment Act name (e.g., 'EA Act (2018)')"}
    )
    work_type_name = fields.Str(
        required=True,
        data_key="work_type_name",
        metadata={"description": "Work type name (e.g., 'Assessment', 'Amendment')"}
    )
    phase_name = fields.Str(
        required=True,
        data_key="phase_name",
        metadata={"description": "Phase name (e.g., 'Early Engagement', 'EAC Application Review')"}
    )
    package_type_name = fields.Str(
        required=True,
        data_key="package_type_name",
        metadata={"description": "Name of the package type to create"}
    )
    package_type_title = fields.Str(
        required=True,
        data_key="package_type_title",
        metadata={"description": "Display title for the package type"}
    )
    item_types = fields.List(
        fields.Nested(ItemTypeSchema),
        required=True,
        data_key="item_types",
        metadata={"description": "List of item types (can be IDs or new item type definitions)"}
    )
    mandatory = fields.Bool(
        required=False,
        data_key="mandatory",
        load_default=False,
        metadata={"description": "Whether this package type must be created by the system"}
    )
    approval_type = fields.Str(
        required=False,
        data_key="approval_type",
        validate=validate.OneOf(['A', 'B', 'C']),
        allow_none=True,
        metadata={"description": "Package approval type: A, B, or C"}
    )
    versioning_enabled = fields.Bool(
        required=False,
        data_key="versioning_enabled",
        load_default=True,
        metadata={"description": "Whether this package type supports versioning"}
    )

    @validates_schema
    def validate_item_types(self, data, **kwargs):
        """Validate that item_types is not empty."""
        if not data.get('item_types'):
            raise ValidationError('item_types must contain at least one item type')
