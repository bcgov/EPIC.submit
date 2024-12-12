"""User model class.

Manages the user
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, Enum, Index

from .base_model import BaseModel
from .db import db


class UserType(enum.Enum):
    """Enum for user type."""

    PROPONENT = 'PROPONENT'
    STAFF = 'STAFF'


class User(BaseModel):
    """Definition of the User entity."""

    __tablename__ = 'users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    auth_guid = Column(db.String(), nullable=False, unique=True)
    type = Column(Enum(UserType), nullable=False)
    account_user = db.relationship(
        'AccountUser', uselist=False, back_populates='user')
    staff_user = db.relationship(
        'StaffUser', uselist=False, back_populates='user')

    __table_args__ = (
        Index('ix_users_auth_guid', 'auth_guid', unique=True),
    )

    @classmethod
    def create_user(cls, data, session=None) -> User:
        """Create user."""
        account_user = User(
            auth_guid=data.get('auth_guid', None),
            type=data.get('type', None)
        )
        if session:
            session.add(account_user)
            session.commit()
        else:
            account_user.save()
        return account_user

    @classmethod
    def get_by_guid(cls, _guid):
        """Get user by guid."""
        return cls.query.filter(cls.auth_guid == _guid).first()
