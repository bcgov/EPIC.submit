"""Account User model class.

Manages the account user
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey
from sqlalchemy.orm import column_property

from .base_model import BaseModel
from .db import db
from .user import User as UserModel


class AccountUser(BaseModel):
    """Definition of the Account User entity."""

    __tablename__ = 'account_users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_id = Column(db.Integer, ForeignKey('accounts.id'), nullable=False)
    first_name = Column(db.String(50), nullable=False)
    last_name = Column(db.String(50), nullable=False)
    full_name = column_property(first_name + ' ' + last_name)
    position = Column(db.String(100), nullable=False)
    work_email_address = Column(db.String(100), nullable=False)
    work_contact_number = Column(db.String(50), nullable=False)
    user_id = Column(db.Integer, ForeignKey('users.id'), nullable=False)

    account = db.relationship('Account', foreign_keys=[account_id], lazy='joined')
    user = db.relationship('User', foreign_keys=[user_id], lazy='joined')

    def to_dict(self):
        """Convert AccountUser ORM object to dictionary."""
        return {
            "id": self.id,
            "account_id": self.account_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "position": self.position,
            "work_email_address": self.work_email_address,
            "work_contact_number": self.work_contact_number,
            "user_id": self.user_id,
        }

    @classmethod
    def create_account_user(cls, data, session=None) -> AccountUser:
        """Create account."""
        account_user = AccountUser(
            account_id=data.get('account_id', None),
            first_name=data.get('first_name', None),
            last_name=data.get('last_name', None),
            position=data.get('position', None),
            work_email_address=data.get('work_email_address', None),
            work_contact_number=data.get('work_contact_number', None),
            user_id=data.get('user_id', None)
        )
        if session:
            session.add(account_user)
            session.commit()
        else:
            account_user.save()
        return account_user

    @classmethod
    def get_by_guid(cls, _guid):
        """Get account user by guid."""
        account_user = cls.query.join(UserModel).filter(UserModel.auth_guid == _guid).first()
        return account_user

    @classmethod
    def get_users_by_account_id(cls, account_id):
        """Get all users for a given account."""
        return cls.query.filter(cls.account_id == account_id).all()
