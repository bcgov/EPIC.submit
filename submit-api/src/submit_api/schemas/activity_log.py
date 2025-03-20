from marshmallow import Schema, fields, post_dump
from enum import Enum


class ActionType(Enum):
    """Enum for different activity actions."""
    ORIGINAL_SUBMISSION = "Original Submission"
    START_CONSULTATION_CHECK = "Start Consultation Check"
    UPDATED_SUBMISSION_REQUESTED = "Updated Submission"
    PASSED_CONSULTATION_CHECK = "Passed Consultation Check"
    FAILED_CONSULTATION_CHECK = "Failed Consultation Check"
    START_MP_REVIEW = "Start MP Review"
    MP_ACCEPTED_APPROVED_SATISFIED = "MP Accepted/Approved/Satisfied"
    MP_REVIEW_REJECTED = "MP Review Failed"
    UPDATED_SUBMISSION = "Updated Submission"


def get_activity_action(action: str, user_type: str) -> str:
    """Map activity log actions based on user type (Proponent/Staff)."""

    action_mapping = {
        ActionType.ORIGINAL_SUBMISSION.value: {
            "PROPONENT": "Original Submission",
            "STAFF": "Original Submission"
        },
        ActionType.START_CONSULTATION_CHECK.value: {
            "PROPONENT": "Start Consultation Check",
            "STAFF": "Start Consultation Check"
        },
        ActionType.UPDATED_SUBMISSION_REQUESTED.value: {
            "PROPONENT": "Update Requested",
            "STAFF": "Update Requested"
        },
        ActionType.PASSED_CONSULTATION_CHECK.value: {
            "PROPONENT": "Passed Consultation Check",
            "STAFF": "Passed Consultation Check"
        },
        ActionType.FAILED_CONSULTATION_CHECK.value: {
            "PROPONENT": "Revision Requested",
            "STAFF": "Failed Consultation Check"
        },
        ActionType.START_MP_REVIEW.value: {
            "PROPONENT": "Start MP Review",
            "STAFF": "Start MP Review"
        },
        ActionType.MP_ACCEPTED_APPROVED_SATISFIED.value: {
            "PROPONENT": "MP Accepted/Approved/Satisfied",
            "STAFF": "MP Accepted/Approved/Satisfied"
        },
        ActionType.MP_REVIEW_REJECTED.value: {
            "PROPONENT": "Revision Required",
            "STAFF": "MP Review Failed"
        },
        ActionType.UPDATED_SUBMISSION.value: {
            "PROPONENT": "Revision Requested",
            "STAFF": "Updated Submission"
        },
    }

    if action in action_mapping and user_type in action_mapping[action]:
        return action_mapping[action][user_type]
    return action  # Default to the original action if not found


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
        """Map action based on is_proponent flag from context."""
        is_proponent = self.context.get("is_proponent", False)  # Default to False

        user_type = "PROPONENT" if is_proponent else "STAFF"

        data["action"] = get_activity_action(data["action"], user_type)
        return data
