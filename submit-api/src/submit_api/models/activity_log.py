"""
Activity Log Model

Tracks user and staff actions performed on various entities in the system.
This model is used for auditing and history tracking.
"""
from __future__ import annotations

from datetime import datetime

from .base_model import BaseModel
from .db import db


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
