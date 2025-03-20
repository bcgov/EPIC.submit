"""Activity Log Schema for Proponent and Staff Activity Logs."""
from marshmallow import Schema, fields, post_dump
from submit_api.enums.activity_type import ActivityActionType
from submit_api.models.user import UserType


def get_activity_action(action: str, user_type: str) -> str:
    """Map activity log actions based on user type (Proponent/Staff)."""
    action_mapping = {
        ActivityActionType.ORIGINAL_SUBMISSION.value: {
            UserType.PROPONENT: "Original Submission",
            UserType.STAFF: "Original Submission"
        },
        ActivityActionType.UPDATED_SUBMISSION.value: {
            UserType.PROPONENT: "Updated Submission",
            UserType.STAFF: "Updated Submission"
        },
        ActivityActionType.START_CONSULTATION_CHECK.value: {
            UserType.PROPONENT: "Start Consultation Check",
            UserType.STAFF: "Start Consultation Check"
        },
        ActivityActionType.UPDATE_REQUESTED.value: {
            UserType.PROPONENT: "Update Requested",
            UserType.STAFF: "Update Requested"
        },
        ActivityActionType.PASSED_CONSULTATION_CHECK.value: {
            UserType.PROPONENT: "Passed Consultation Check",
            UserType.STAFF: "Passed Consultation Check"
        },
        ActivityActionType.FAILED_CONSULTATION_CHECK.value: {
            UserType.PROPONENT: "Revision Requested",
            UserType.STAFF: "Failed Consultation Check"
        },
        ActivityActionType.START_MP_REVIEW.value: {
            UserType.PROPONENT: "Start MP Review",
            UserType.STAFF: "Start MP Review"
        },
        ActivityActionType.MP_ACCEPTED.value: {
            UserType.PROPONENT: "MP Accepted",
            UserType.STAFF: "MP Accepted"
        },
        ActivityActionType.MP_APPROVED.value: {
            UserType.PROPONENT: "MP Approved",
            UserType.STAFF: "MP Approved"
        },
        ActivityActionType.MP_SATISFIED.value: {
            UserType.PROPONENT: "MP Satisfied",
            UserType.STAFF: "MP Satisfied"
        },
        ActivityActionType.MP_REVIEW_REJECTED.value: {
            UserType.PROPONENT: "Revision Requested",
            UserType.STAFF: "MP Review Rejected"
        },
        ActivityActionType.REVISION_REQUIRED.value: {
            UserType.PROPONENT: "Revision Required",
            UserType.STAFF: "Revision Required"
        },
        ActivityActionType.MP_REVIEW_FAILED.value: {
            UserType.PROPONENT: "Revision Required",
            UserType.STAFF: "MP Review Failed"
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

        user_type = UserType.PROPONENT if is_proponent else UserType.STAFF

        data["action"] = get_activity_action(data["action"], user_type)
        return data
