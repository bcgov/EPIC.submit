"""Submission package type model class.

Manages the package types
"""
from __future__ import annotations

from sqlalchemy import Column, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db
from ..enums.package_type import PackageApprovalType


class PackageType(BaseModel):
    """Definition of the package type entity."""

    __tablename__ = 'package_types'
    __table_args__ = (
        UniqueConstraint('name', 'phase_id', name='uq_package_type_name_phase'),
    )

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    title = Column(
        db.String(255), nullable=True,
        comment="Display title for the package type"
    )
    phase_id = Column(db.Integer, ForeignKey('track_phases.id'), nullable=True)
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
        db.String(255), nullable=True,
        comment="Success message to display to user after submission"
    )
    phase = relationship('TrackPhase', foreign_keys=[phase_id], lazy='joined')
    item_types = relationship('ItemType', secondary='package_item_types', back_populates='package_types')

    @classmethod
    def find_by_name(cls, name: str):
        """Return model by name."""
        return cls.query.filter_by(name=name).first()

    @classmethod
    def find_by_name_and_phase(cls, name: str, phase_id: int):
        """Return model by name and phase_id."""
        return cls.query.filter_by(name=name, phase_id=phase_id).first()

    @classmethod
    def find_by_phase_id(cls, phase_id: int):
        """Return all package types for a given phase_id, ordered by id."""
        return cls.query.filter_by(phase_id=phase_id).order_by(cls.id).all()
