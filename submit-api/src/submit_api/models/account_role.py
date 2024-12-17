"""Role model class.

Manages the role
"""
from __future__ import annotations

import enum

from sqlalchemy import Column

from .base_model import BaseModel
from .db import db


class AccountRoleEnum(enum.Enum):
    """Enum for Role"""

    ACCOUNT_PRIMARY_ADMIN = 'ACCOUNT_PRIMARY_ADMIN'


class AccountRole(BaseModel):
    """Definition of the Role entity."""

    __tablename__ = 'account_roles'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    role_name = Column(db.String(50), nullable=False)
    description = Column(db.Text(), nullable=False)

    @classmethod
    def get_by_name(cls, role_name) -> AccountRole:
        """Fetch role by role name."""
        return cls.query.filter_by(role_name=role_name).first()
