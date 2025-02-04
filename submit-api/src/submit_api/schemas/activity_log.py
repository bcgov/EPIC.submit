"""Package ActivityLogSchema class.

Manages the ActivityLogSchema
"""

from marshmallow import Schema, fields


class ActivityLogSchema(Schema):
    """Schema for serializing Activity Log records."""

    action = fields.String(required=True, description="Action performed (e.g., 'SUBMITTED', 'APPROVED').")
    activity_at = fields.DateTime(format="%Y-%m-%dT%H:%M:%S+00:00", description="Timestamp of the activity.")
    entity_type = fields.String(required=True, description="Type of entity (e.g., 'SUBMISSION').")
    entity_id = fields.Integer(required=True, description="ID of the related entity.")
    entity_version = fields.Integer(required=True, description="Version number of the entity.")
    actor_id = fields.String(required=True, description="ID of the actor who performed the action.")
    actor_type = fields.String(required=True, description="Actor type (e.g., 'USER', 'STAFF').")
    visibility = fields.String(required=True, description="Who can see this entry ('PUBLIC' or 'STAFF_ONLY').")

    class Meta:
        """Meta class to declare any class attributes."""

        model = "ActivityLog"  # Ensure this matches your SQLAlchemy model
