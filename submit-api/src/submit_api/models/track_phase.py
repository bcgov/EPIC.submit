"""Track Phase model class.

Manages phase definitions from EPIC.track
"""
from __future__ import annotations

from sqlalchemy import Column

from .base_model import BaseModel
from .db import db


class TrackPhase(BaseModel):
    """Definition of the Track Phase entity."""

    __tablename__ = 'track_phases'

    id = Column(db.Integer, primary_key=True, autoincrement=False, comment='Phase ID from EPIC.track')
    name = Column(db.String(255), nullable=False, comment='Phase name')
    ea_act_id = Column(db.Integer, nullable=True, comment='Environmental Assessment Act ID')
    work_type_id = Column(db.Integer, nullable=False, comment='Work type ID from EPIC.track')
    work_type_name = Column(db.String(255), nullable=True, comment='Work type name for display')
    sort_order = Column(db.Integer, nullable=True, comment='Order of phase in workflow')
    number_of_days = Column(db.Integer, nullable=True, comment='Number of days allocated for this phase')
    legislated = Column(
        db.Boolean, nullable=False, default=False,
        comment='Whether this phase has legislated time requirements'
    )
    enable_submit = Column(
        db.Boolean, nullable=False, default=False,
        comment='Enable this phase for the submit to accept submissions'
    )
    is_active = Column(db.Boolean, nullable=False, default=True, comment='Whether this phase is currently active')
    is_deleted = Column(db.Boolean, nullable=False, default=False, comment='Soft delete flag')

    __table_args__ = (
        db.Index('idx_track_phases_work_type_id', 'work_type_id'),
        db.Index('idx_track_phases_name', 'name'),
    )

    @classmethod
    def find_by_work_type(cls, work_type_id: int):
        """Return phases by work type id."""
        return cls.query.filter_by(
            work_type_id=work_type_id, is_active=True, is_deleted=False
        ).order_by(cls.sort_order).all()

    @classmethod
    def find_active_phases(cls):
        """Return all active phases."""
        return cls.query.filter_by(is_active=True, is_deleted=False).order_by(cls.work_type_id, cls.sort_order).all()
