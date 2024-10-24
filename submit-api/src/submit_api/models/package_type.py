"""Submission package type model class.

Manages the package types
"""
from __future__ import annotations

from sqlalchemy import Column
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db


class PackageType(BaseModel):
    """Definition of the package type entity."""

    __tablename__ = 'package_types'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    item_types = relationship('ItemType', secondary='package_item_types', back_populates='package_types')

    __table_args__ = (db.Index('idx_package_types_name', 'name'),)

    @classmethod
    def find_by_name(cls, name: str):
        """Return model by name."""
        return cls.query.filter_by(name=name).first()
