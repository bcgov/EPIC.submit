"""Role model class.

Manages roles for accounts, projects, and submissions.
"""
from __future__ import annotations

import enum
from sqlalchemy import Column, String, Text
from .base_model import BaseModel
from .db import db


class RoleEnum(enum.Enum):
    """Enum for Role types"""

    ACCOUNT_PRIMARY_ADMIN = 'ACCOUNT_PRIMARY_ADMIN'
    PROJECT_ADMIN = 'PROJECT_ADMIN'
    SUBMISSION_ADMIN = 'SUBMISSION_ADMIN'
    SPECIFIC_SUBMISSION_CONTRIBUTOR = 'SPECIFIC_SUBMISSION_CONTRIBUTOR'


class Role(BaseModel):
    """Definition of the Role entity."""

    __tablename__ = 'roles'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), nullable=False, unique=True)
    label = Column(String(100), nullable=False)  # UI-friendly display name
    description = Column(Text(), nullable=False)

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "role_name": self.role_name,
            "label": self.label,
            "description": self.description
        }

    @classmethod
    def get_by_name(cls, role_name) -> Role:
        """Fetch role by role name."""
        return cls.query.filter_by(role_name=role_name).first()
