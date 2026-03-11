"""Track Work model class.

Manages work data synchronized from EPIC.track
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class TrackWork(BaseModel):
    """Definition of the Track Work entity.

    This is a read-only table synchronized from EPIC.track via cron job.
    """

    __tablename__ = 'track_works'

    id = Column(db.Integer, primary_key=True, autoincrement=False, comment='Work ID from EPIC.track')
    project_id = Column(db.Integer, ForeignKey('projects.id'), nullable=False, comment='Associated project ID')
    current_phase_id = Column(
        db.Integer, ForeignKey('track_phases.id'), nullable=True,
        comment='Current phase of the work'
    )
    work_state = Column(db.String(50), nullable=True, comment='Current state (e.g., IN_PROGRESS, COMPLETED)')
    title = Column(db.String(500), nullable=True, comment='Work title')
    is_active = Column(db.Boolean, nullable=False, default=True, comment='Whether this work is currently active')
    is_deleted = Column(db.Boolean, nullable=False, default=False, comment='Soft delete flag')

    project = db.relationship('Project', foreign_keys=[project_id], lazy='joined')
    current_phase = db.relationship('TrackPhase', foreign_keys=[current_phase_id], lazy='joined')

    __table_args__ = (
        db.Index('idx_track_works_project_id', 'project_id'),
        db.Index('idx_track_works_work_state', 'work_state'),
    )

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "current_phase_id": self.current_phase_id,
            "current_phase": self.current_phase.to_dict() if self.current_phase else None,
            "work_state": self.work_state,
            "title": self.title,
        }

    @classmethod
    def find_by_project_id(cls, project_id: int):
        """Return works by project id."""
        return cls.query.filter_by(project_id=project_id, is_deleted=False).all()

    @classmethod
    def find_active_works(cls):
        """Return all active works."""
        return cls.query.filter_by(is_active=True, is_deleted=False).all()
