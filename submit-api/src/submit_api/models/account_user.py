"""Account User model class.

Manages the account user
"""
from __future__ import annotations

from datetime import datetime, UTC

from sqlalchemy import Column, ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import column_property

from .base_model import BaseModel
from .db import db
from .user import User as UserModel
from .user_role import UserRole


class AccountUser(BaseModel):
    """Definition of the Account User entity."""

    __tablename__ = 'account_users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_id = Column(db.Integer, ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False)
    first_name = Column(db.String(50), nullable=False)
    last_name = Column(db.String(50), nullable=False)
    full_name = column_property(first_name + ' ' + last_name)
    position = Column(db.String(100), nullable=False)
    work_email_address = Column(db.String(100), nullable=False)
    work_contact_number = Column(db.String(50), nullable=False)
    user_id = Column(db.Integer, ForeignKey('users.id'), nullable=False)
    extension_number = Column(db.String(50), nullable=True)
    account = db.relationship('Account', foreign_keys=[account_id], lazy='joined')
    user = db.relationship('User', foreign_keys=[user_id], lazy='joined')
    roles = db.relationship('UserRole', back_populates='account_user', cascade='all, delete', passive_deletes=True)

    @property
    def role(self):
        """Return the first role for backward compatibility."""
        return self.roles[0] if self.roles else None
    terms_of_service_version_id = Column(db.Integer, db.ForeignKey('account_terms_of_service.version'), nullable=True)
    terms_of_service_accepted_date = db.Column(db.DateTime, default=datetime.now(UTC), nullable=True)
    company_name = Column(db.String(255), nullable=True)

    terms_of_service = db.relationship(
        'TermsOfService',
        primaryjoin='AccountUser.terms_of_service_version_id == TermsOfService.version',
        lazy='joined',
        uselist=False
    )

    @hybrid_property
    def has_agreed_to_terms(self) -> bool:
        """Return True if terms_of_service_version_id points to an active TermsOfService."""
        return bool(self.terms_of_service and self.terms_of_service.active)

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
            "extension_number": self.extension_number,
            "company_name": self.company_name,
            "role": self.role.to_dict() if self.role else None,
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
            company_name=data.get('company_name', None),
            user_id=data.get('user_id', None),
            extension_number=data.get('extension_number', None),
            terms_of_service_version_id=data.get('terms_of_service_version_id')
        )
        return account_user.persist(session)

    @classmethod
    def get_by_guid(cls, _guid):
        """Get account user by guid."""
        account_user = cls.query.join(UserModel).filter(UserModel.auth_guid == _guid).first()
        return account_user

    @classmethod
    def get_users_by_account_id(cls, account_id):
        """Get all users for a given account."""
        return cls.query.filter(cls.account_id == account_id).all()

    @classmethod
    def get_all_in_account_ids(cls, account_ids: list[int]):
        """Get all users for the given account ids."""
        return cls.query.filter(cls.account_id.in_(account_ids)).all()

    @classmethod
    def get_users_by_account_user_id(cls, account_user_id):
        """Get the user for a given account."""
        return cls.query.filter(cls.id == account_user_id).first()

    @classmethod
    def get_filtered_by_account_id(cls, account_id: int, account_project_ids: list = None):
        """Get account users by account id, optionally filtered by project ids."""
        query = cls.query.filter(cls.account_id == account_id)
        if account_project_ids:
            query = query.join(UserRole).filter(
                UserRole.account_project_id.in_(account_project_ids)
            )
        return query.all()
