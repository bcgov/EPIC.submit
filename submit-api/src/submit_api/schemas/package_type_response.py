"""Package type response schema.

Schema for package type creation/update response.
"""

from marshmallow import EXCLUDE, Schema, fields


class CreatedItemTypeSchema(Schema):
    """Schema for created item type in response."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(
        required=True,
        metadata={"description": "Created item type ID"}
    )
    name = fields.Str(
        required=True,
        metadata={"description": "Item type name"}
    )
    submission_method = fields.Str(
        required=True,
        metadata={"description": "Submission method (FORM_SUBMISSION or DOCUMENT_UPLOAD)"}
    )


class PackageTypeResponseSchema(Schema):
    """Schema for package type creation/update response."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(
        required=True,
        metadata={"description": "Package type ID"}
    )
    name = fields.Str(
        required=True,
        metadata={"description": "Package type name"}
    )
    phase_id = fields.Int(
        required=True,
        metadata={"description": "Associated phase ID from track_phases table"}
    )
    phase_name = fields.Str(
        required=True,
        metadata={"description": "Display name of the phase"}
    )
    ea_act_name = fields.Str(
        required=True,
        metadata={"description": "Environmental Assessment Act name"}
    )
    work_type_name = fields.Str(
        required=True,
        metadata={"description": "Work type name"}
    )
    item_type_ids = fields.List(
        fields.Int(),
        required=True,
        metadata={"description": "List of all associated item type IDs"}
    )
    created_item_types = fields.List(
        fields.Nested(CreatedItemTypeSchema),
        required=True,
        metadata={"description": "List of newly created item types (empty if all existed)"}
    )
    created = fields.Boolean(
        required=True,
        metadata={"description": "True if package type newly created, False if updated"}
    )
