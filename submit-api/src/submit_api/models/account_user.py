"""Account User model class.

Manages the account user
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Index

from .base_model import BaseModel
from .db import db


class AccountUser(BaseModel):
    """Definition of the Account User entity."""

    __tablename__ = 'account_users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_id = Column(db.Integer, ForeignKey('accounts.id'), nullable=False)
    user_id = Column(db.Integer, ForeignKey('users.id'), nullable=False)
    account = db.relationship('Account', foreign_keys=[account_id], lazy='joined')

    Index('ix_account_users_account_id', account_id)

    @classmethod
    def create_account_user(cls, data, session=None) -> AccountUser:
        """Create account."""
        account_user = AccountUser(
            account_id=data.get('account_id', None),
            user_id=data.get('user_id', None)
        )
        if session:
            session.add(account_user)
            session.commit()
        else:
            account_user.save()
        return account_user
