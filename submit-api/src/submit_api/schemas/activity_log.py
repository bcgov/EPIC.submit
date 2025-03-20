"""Package ActivityLogSchema class.

Manages the ActivityLogSchema
"""

from enum import Enum
from marshmallow import Schema, fields, post_dump


class ActionType(Enum):
    """Enum for different activity actions."""
    ORIGINAL_SUBMISSION = "Original Submission"
    START_CONSULTATION_CHECK = "Start Consultation Check"
    UPDATED_SUBMISSION_REQUESTED = "Updated Submission"
    PASSED_CONSULTATION_CHECK = "Passed Consultation Check"
    FAILED_CONSULTATION_CHECK = "Failed Consultation Check"
    START_MP_REVIEW = "Start MP Review"
    MP_ACCEPTED_APPROVED_SATISFIED = "MP Accepted/Approved/Satisfied"
    MP_REVIEW_REJECTED = "MP Review Rejected"
    UPDATED_SUBMISSION = "Updated Submission"


def map_action(action: str) -> str:
    """Maps actions based on predefined logic."""
    action_mapping = {
        ActionType.ORIGINAL_SUBMISSION.value: "Original Submission",
        ActionType.START_CONSULTATION_CHECK.value: "Start Consultation Check",
        ActionType.UPDATED_SUBMISSION_REQUESTED.value: "Update Requested",
        ActionType.PASSED_CONSULTATION_CHECK.value: "Passed Consultation Check",
        ActionType.FAILED_CONSULTATION_CHECK.value: "Revision Requested",
        ActionType.START_MP_REVIEW.value: "Start MP Review",
        ActionType.MP_ACCEPTED_APPROVED_SATISFIED.value: "MP Accepted/Approved/Satisfied",
        ActionType.MP_REVIEW_REJECTED.value: "Revision Required",
        ActionType.UPDATED_SUBMISSION.value: "Revision Requested",
    }

    return action_mapping.get(action, action)  # Default to the same action if not found


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

    @post_dump
    def apply_action_mapping(self, data, many, **kwargs):
        """Map action based on is_proponent flag."""
        is_proponent = self.context.get("is_proponent", False)  # Default to False
        if is_proponent:
            data["action"] = map_action(data["action"])
        return data


    class Meta:
        """Meta class to declare any class attributes."""

        model = "ActivityLog"  # Ensure this matches your SQLAlchemy model
