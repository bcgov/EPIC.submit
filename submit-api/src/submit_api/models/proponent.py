"""Proponent model class.

Manages the proponent entity.
"""
from __future__ import annotations

from sqlalchemy import Column, String, Integer, Boolean, Enum as SQLEnum

from .base_model import BaseModel
from .project import Project
from ..enums.proponent_status import ProponentStatus


class Proponent(BaseModel):
    """Definition of the Proponent entity."""

    __tablename__ = 'proponents'

    id = Column(Integer, primary_key=True, autoincrement=False)
    name = Column(String(), nullable=False)
    status = Column(SQLEnum(ProponentStatus), nullable=True, default=None)
    is_deleted = Column(Boolean, nullable=False, default=False)

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status.value if self.status else None,
            "is_deleted": self.is_deleted,
        }

    @classmethod
    def get_all_proponents(cls, include_deleted=False, approved_conditions_only=None):
        """Get all proponents."""
        query = cls.query

        if approved_conditions_only is True:
            query = query.join(Project, cls.id == Project.proponent_id)
            query = query.filter(Project.has_approved_condition.is_(True))
            query = query.distinct()

        if not include_deleted:
            query = query.filter(cls.is_deleted.is_(False))

        return query.order_by(cls.name).all()

    @classmethod
    def get_by_id(cls, proponent_id, is_deleted=False) -> Proponent | None:
        """Get a proponent by id."""
        return cls.query.filter_by(id=proponent_id, is_deleted=is_deleted).first()
