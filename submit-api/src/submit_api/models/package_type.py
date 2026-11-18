"""Submission package type model class.

Manages the package types
"""
from __future__ import annotations

from sqlalchemy import Column, Enum, ForeignKey, UniqueConstraint, or_
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db
from .track_phase import TrackPhase
from ..enums.package_type import PackageApprovalType


class PackageType(BaseModel):
    """Definition of the package type entity.

    A package type is submittable while a work's current phase is its start phase or its end phase.
    Phase-less package types (e.g. Management Plan) leave both columns null.
    """

    __tablename__ = 'package_types'
    __table_args__ = (
        UniqueConstraint('name', 'start_phase_id', 'end_phase_id', name='uq_package_type_name_phase_range'),
    )

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    title = Column(
        db.String(255), nullable=True,
        comment="Display title for the package type"
    )
    start_phase_id = Column(
        db.Integer, ForeignKey('track_phases.id'), nullable=True,
        comment="First track phase in which this package type can be submitted"
    )
    end_phase_id = Column(
        db.Integer, ForeignKey('track_phases.id'), nullable=True,
        comment="Last track phase in which this package type can be submitted"
    )
    phase_label = Column(
        db.String(255), nullable=True,
        comment="Text shown to the proponent for the phase range, e.g. Pre-EA/Early Engagement"
    )
    approval_type = Column(Enum(PackageApprovalType), nullable=True)
    versioning_enabled = Column(
        db.Boolean, nullable=False, default=True,
        comment="Whether this package type supports versioning"
    )
    mandatory = Column(
        db.Boolean, nullable=False, default=False,
        comment="Whether this package type must be created by the system"
    )
    success_message = Column(
        db.Text, nullable=True,
        comment="Success message to display to user after submission"
    )
    start_phase = relationship('TrackPhase', foreign_keys=[start_phase_id], lazy='joined')
    end_phase = relationship('TrackPhase', foreign_keys=[end_phase_id], lazy='joined')
    item_types = relationship('ItemType', secondary='package_item_types', back_populates='package_types')

    @property
    def has_phase(self) -> bool:
        """Return True if the package type is tied to a phase range."""
        return self.start_phase_id is not None or self.end_phase_id is not None

    def matches_phase(self, phase_id: int | None) -> bool:
        """Return True if phase_id is this package type's start or end phase."""
        return phase_id is not None and phase_id in (self.start_phase_id, self.end_phase_id)

    @classmethod
    def find_by_name(cls, name: str):
        """Return model by name."""
        return cls.query.filter_by(name=name).first()

    @classmethod
    def find_by_name_and_phases(cls, name: str, start_phase_id: int | None, end_phase_id: int | None):
        """Return model by name and start/end phase pair (None values match phase-less types)."""
        return cls.query.filter_by(
            name=name, start_phase_id=start_phase_id, end_phase_id=end_phase_id
        ).first()

    @classmethod
    def find_by_phase_id(cls, phase_id: int):
        """Return all package types whose start or end phase is phase_id, ordered by id.

        Returns an empty list when the phase does not have ``enable_submit`` turned on, since Submit
        does not accept submissions for such a phase.
        """
        phase = TrackPhase.find_by_id(phase_id)
        if not phase or not phase.enable_submit:
            return []
        return cls.query.filter(
            or_(cls.start_phase_id == phase_id, cls.end_phase_id == phase_id)
        ).order_by(cls.id).all()
