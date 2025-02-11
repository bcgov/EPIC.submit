"""
Activity Log Model

Tracks user and staff actions performed on various entities in the system.
This model is used for auditing and history tracking.
"""
from __future__ import annotations

from datetime import datetime

from .base_model import BaseModel
from .db import db
from ..enums.activity_type import VisibilityTypeEnum


class ActivityLog(BaseModel):
    """Represents an activity log entry in the database."""

    __tablename__ = 'activity_logs'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    entity_type = db.Column(db.String(50), nullable=False, index=True)  # e.g., 'Submission', 'User'
    entity_id = db.Column(db.Integer, nullable=False, index=True)  # Related record ID
    entity_version = db.Column(db.Integer, nullable=False, default=1, index=True)  # Entity version (track changes)
    action = db.Column(db.String(100), nullable=False)
    actor_id = db.Column(db.String(), nullable=False)
    actor_type = db.Column(db.String(20), nullable=False)  # 'staff' or 'user'
    activity_at = db.Column(db.DateTime, default=datetime.utcnow)  # When it was logged
    visibility = db.Column(db.String(20), nullable=False,
                           default='staff')  # can public see this entry ? 'staff' or 'public'

    def to_dict(self):
        """Creates a dict version for easy return."""
        return {
            "action": self.action,
            "activity_at": self.activity_at.strftime('%d-%b-%Y %H:%M:%S UTC'),
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "actor_id": self.actor_id,
            "actor_type": self.actor_type,
            "visibility": self.visibility
        }

    @classmethod
    def get_activity_logs(cls, entity_type: str, entity_id: int, for_staff: bool = True) -> list:
        """
        Retrieve activity logs for a specific entity type and ID.

        - `entity_type`: The type of entity (e.g., 'submission', 'file_upload').
        - `entity_id`: The specific entity ID.
        - `for_staff`: If False, only public logs are returned.

        Returns a list of logs.
        """
        query = cls.query.filter_by(entity_type=entity_type, entity_id=entity_id)

        if not for_staff:
            query = query.filter(cls.visibility == VisibilityTypeEnum.PUBLIC.value)

        logs = query.order_by(cls.activity_at.asc()).all()
        return logs
