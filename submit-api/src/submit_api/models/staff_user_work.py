"""Staff User Work model class.

Manages the junction between staff users and works with role assignments
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, UniqueConstraint

from .base_model import BaseModel
from .db import db


class StaffUserWork(BaseModel):
    """Definition of the Staff User Work entity.

    Junction table linking staff users to specific works with role assignments.
    """

    __tablename__ = 'staff_user_works'
    __table_args__ = (
        UniqueConstraint('staff_user_id', 'work_id', name='uq_staff_user_work'),
        db.Index('idx_staff_user_works_staff_user_id', 'staff_user_id'),
        db.Index('idx_staff_user_works_work_id', 'work_id'),
    )

    id = Column(
        db.Integer, primary_key=True, autoincrement=True,
        comment='Unique identifier for staff user work assignment'
    )
    staff_user_id = Column(
        db.Integer, ForeignKey('staff_users.id', ondelete='CASCADE'),
        nullable=False, comment='Staff user ID'
    )
    work_id = Column(
        db.Integer, ForeignKey('track_works.id', ondelete='CASCADE'),
        nullable=False, comment='Work ID from EPIC.track'
    )
    role = Column(
        db.String(50), nullable=False,
        comment='Work role: TEAM_LEAD or TEAM_MEMBER'
    )
    is_active = Column(
        db.Boolean, nullable=False, default=True,
        comment='Whether this assignment is currently active'
    )

    staff_user = db.relationship(
        'StaffUser',
        foreign_keys=[staff_user_id],
        lazy='joined',
        back_populates='work_assignments')

    work = db.relationship('TrackWork', foreign_keys=[work_id], lazy='joined')

    @classmethod
    def find_by_staff_user_id(cls, staff_user_id: int):
        """Return active work assignments by staff user id."""
        return cls.query.filter_by(staff_user_id=staff_user_id, is_active=True).all()

    @classmethod
    def find_by_work_id(cls, work_id: int):
        """Return active staff user assignments by work id."""
        return cls.query.filter_by(work_id=work_id, is_active=True).all()

    @classmethod
    def get_or_create(cls, staff_user_id: int, work_id: int, role: str, session=None):
        """Create or get staff user work assignment.

        Args:
            staff_user_id: ID of the staff user
            work_id: ID of the work
            role: Work role (TEAM_LEAD or TEAM_MEMBER)
            session: Optional database session

        Returns:
            StaffUserWork: The created or existing instance
        """
        existing = cls.query.filter_by(
            staff_user_id=staff_user_id,
            work_id=work_id
        ).first()

        if existing:
            # Update if role changed or reactivate if inactive
            if existing.role != role or not existing.is_active:
                existing.role = role
                existing.is_active = True
                existing.persist(session)
            return existing

        new_instance = cls(
            staff_user_id=staff_user_id,
            work_id=work_id,
            role=role,
            is_active=True
        )

        return new_instance.persist(session)

    @classmethod
    def find_by_staff_user_and_work(cls, staff_user_id: int, work_id: int):
        """Find assignment by staff user and work."""
        return cls.query.filter_by(
            staff_user_id=staff_user_id,
            work_id=work_id
        ).first()
