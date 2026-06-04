"""Invitation schema class.

Manages the invitation.
"""

from submit_api.schemas.role import RoleSchema
from marshmallow import Schema, fields


class ProjectSelectionSchema(Schema):
    """Schema for project selection with works and non-work items."""

    project_id = fields.Int(required=True, metadata={"description": "Project ID"})
    work_ids = fields.List(
        fields.Int(), required=False, allow_none=True, metadata={"description": "List of Work IDs"}
    )
    non_work_item_types = fields.List(
        fields.Str(), required=False, allow_none=True, metadata={"description": "List of non-work item types"}
    )


class CreateNewAccountInvitationSchema(Schema):
    """Schema for creating a new account invitation."""

    proponent_id = fields.Int(required=True, metadata={"description": "Proponent ID"})
    role_name = fields.Str(required=True, metadata={"description": "Role Name"})
    project_ids = fields.List(
        fields.Int(), required=False, metadata={"description": "DEPRECATED: Use project_selections instead"}
    )
    project_selections = fields.List(
        fields.Nested(ProjectSelectionSchema),
        required=False,
        allow_none=True,
        metadata={"description": "Structured project selections with works and non-work items (preferred)"}
    )


class CreateInvitationToExistingAccountProjectSchema(Schema):
    """Schema for creating an invitation."""

    proponent_id = fields.Int(required=True, metadata={"description": "Proponent ID"})
    account_id = fields.Int(required=False, metadata={"description": "Account ID"})
    account_project_ids = fields.List(
        fields.Int(),
        required=False,
        metadata={"description": "List of Account Project IDs"},
    )
    project_ids = fields.List(
        fields.Int(),
        required=False,
        allow_none=True,
        metadata={"description": "Project IDs"},
    )
    role_name = fields.Str(required=True, metadata={"description": "Role Name"})
    original_package_ids = fields.List(
        fields.Int(),
        required=False,
        allow_none=True,
        metadata={"description": "Original Package IDs"},
    )
    email = fields.Email(
        required=False, metadata={"description": "Optional email for client"}
    )


class InvitationSchema(Schema):
    """Schema for representing an invitation."""

    id = fields.Int()
    account_id = fields.Int()
    project_ids = fields.List(fields.Int(), allow_none=True)
    project_selections = fields.List(
        fields.Nested(ProjectSelectionSchema),
        allow_none=True,
        metadata={"description": "Structured project selections with works and non-work items"}
    )
    package_ids = fields.List(fields.Int(), allow_none=True)
    original_package_ids = fields.List(fields.Int(), allow_none=True)
    role_id = fields.Int()
    role_name = fields.Str()
    token = fields.Str()
    email = fields.Email(allow_none=True)
    status = fields.Str()
    expiry_date = fields.DateTime()
    created_date = fields.DateTime()
    role = fields.Nested(RoleSchema, data_key="role", dump_only=True)
    is_first_time = fields.Bool(dump_default=False)
    proponent_id = fields.Method("get_proponent_id")

    def get_proponent_id(self, obj):
        """Get proponent_id from the related account."""
        return obj.account.proponent_id if obj.account else None
