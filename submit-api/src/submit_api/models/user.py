"""User model class.

Manages the user
"""
from __future__ import annotations

from sqlalchemy import Column, Index

from .base_model import BaseModel
from .db import db


class User(BaseModel):
    """Definition of the User entity."""

    __tablename__ = 'users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    auth_guid = Column(db.String(), nullable=False, unique=True)

    __table_args__ = (
        Index('ix_users_auth_guid', 'auth_guid', unique=True),
    )

    @classmethod
    def create_account_user(cls, data, session=None) -> User:
        """Create account."""
        account_user = User(
            auth_guid=data.get('auth_guid', None)
        )
        if session:
            session.add(account_user)
            session.commit()
        else:
            account_user.save()
        return account_user
