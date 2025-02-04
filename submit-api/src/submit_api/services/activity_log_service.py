"""
Activity Log Service

Provides utility functions for logging user and staff actions in the system.
Handles creation and retrieval of activity logs.
"""

from datetime import datetime
from typing import Optional

from submit_api.enums.activity_type import ActivityTypeEnum, VisibilityTypeEnum, ActorTypeEnum
from submit_api.models.activity_log import ActivityLog
from submit_api.models.db import session_scope


class ActivityLogService:
    """Service class for handling activity log operations."""

    @staticmethod
    def log_activity(  # pylint: disable=too-many-arguments
            entity_id: int,
            action: str,
            actor_id: int,
            actor_type: str = ActorTypeEnum.STAFF.value,
            entity_type=ActivityTypeEnum.SUBMISSION.value,
            entity_version: int = 1,
            visibility: str = VisibilityTypeEnum.STAFF.value,
            session=None,
    ) -> Optional[ActivityLog]:
        """Logs an activity in the activity_logs table."""
        if session is None:
            with session_scope() as new_session:
                return ActivityLogService.log_activity(
                    session=new_session,
                    entity_id=entity_id,
                    action=action,
                    actor_id=actor_id,
                    actor_type=actor_type,
                    entity_type=entity_type,
                    entity_version=entity_version,
                    visibility=visibility
                )

        new_activity = ActivityLogService._create_activity_log_object(
            entity_type, entity_id, entity_version, action, actor_id, actor_type, visibility
        )

        session.add(new_activity)
        return new_activity

    @staticmethod
    def get_activity_logs(entity_type: str, entity_id: int, for_staff: bool = True) -> list:
        """
        Retrieve activity logs for a specific entity type and ID.

        - `entity_type`: The type of entity (e.g., 'submission', 'file_upload').
        - `entity_id`: The specific entity ID.
        - `for_staff`: If False, only public logs are returned.

        Returns a list of logs.
        """
        query = ActivityLog.query.filter_by(entity_type=entity_type, entity_id=entity_id)

        if not for_staff:
            query = query.filter(ActivityLog.visibility == "public")

        logs = query.order_by(ActivityLog.activity_at.desc()).all()
        return logs

    @staticmethod
    def _create_activity_log_object(  # pylint: disable=too-many-arguments
            entity_type, entity_id, entity_version, action, actor_id, actor_type, visibility
    ) -> ActivityLog:
        """Creates an ActivityLog object without adding it to a session."""
        return ActivityLog(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_version=entity_version,
            action=action,
            actor_id=actor_id,
            actor_type=actor_type,
            visibility=visibility,
            activity_at=datetime.utcnow()
        )
