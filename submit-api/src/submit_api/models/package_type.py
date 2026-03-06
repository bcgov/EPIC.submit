"""Submission package type model class.

Manages the package types
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db


class PackageType(BaseModel):
    """Definition of the package type entity."""

    __tablename__ = 'package_types'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    phase_id = Column(db.Integer, ForeignKey('track_phases.id'), nullable=True)
    phase = relationship('TrackPhase', foreign_keys=[phase_id], lazy='joined')
    item_types = relationship('ItemType', secondary='package_item_types', back_populates='package_types')

    @classmethod
    def find_by_name(cls, name: str):
        """Return model by name."""
        return cls.query.filter_by(name=name).first()
