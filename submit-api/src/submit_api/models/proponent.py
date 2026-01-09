"""Proponent model class.

Manages the proponent entity.
"""
from __future__ import annotations

from sqlalchemy import Column, String, Integer, Boolean, Enum as SQLEnum

from .db import db
from ..enums.proponent_status import ProponentStatus


class Proponent(db.Model):
    """Definition of the Proponent entity."""

    __tablename__ = 'proponents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    proponent_id = Column(Integer, nullable=False, unique=True)
    name = Column(String(), nullable=False)
    status = Column(SQLEnum(ProponentStatus), nullable=True, default=None)
    is_deleted = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        db.Index('ix_proponents_proponent_id', 'proponent_id'),
    )

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "proponent_id": self.proponent_id,
            "name": self.name,
            "status": self.status.value if self.status else None,
            "is_deleted": self.is_deleted,
        }

    @classmethod
    def get_all_proponents(cls, include_deleted=False):
        """Get all proponents without filtering by status."""
        query = cls.query
        if not include_deleted:
            query = query.filter(cls.is_deleted.is_(False))
        return query.order_by(cls.name).all()
