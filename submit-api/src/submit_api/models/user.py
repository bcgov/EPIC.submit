"""Account User model class.

Manages the account user
"""
from __future__ import annotations

from sqlalchemy import Column, Index
from sqlalchemy.orm import column_property

from .base_model import BaseModel
from .db import db


class User(BaseModel):
    """Definition of the User entity."""

    __tablename__ = 'users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = Column(db.String(50), nullable=False)
    last_name = Column(db.String(50), nullable=False)
    full_name = column_property(first_name + ' ' + last_name)
    position = Column(db.String(100), nullable=True)
    work_email_address = Column(db.String(100), nullable=True)
    work_contact_number = Column(db.String(50), nullable=True)
    auth_guid = Column(db.String(), nullable=False, unique=True)

    __table_args__ = (
        Index('ix_users_auth_guid', 'auth_guid', unique=True),
    )

    @classmethod
    def create_account_user(cls, data, session=None) -> User:
        """Create account."""
        account_user = User(
            first_name=data.get('first_name', None),
            last_name=data.get('last_name', None),
            position=data.get('position', None),
            work_email_address=data.get('work_email_address', None),
            work_contact_number=data.get('work_contact_number', None),
            auth_guid=data.get('auth_guid', None)
        )
        if session:
            session.add(account_user)
            session.commit()
        else:
            account_user.save()
        return account_user
