"""Account Role model class.

Manages the account role
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class AccountUserRole(BaseModel):
    """Definition of the Account Role entity."""

    __tablename__ = 'account_user_roles'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_user_id = Column(db.Integer, ForeignKey('account_users.id'), nullable=False)
    role_id = Column(db.Integer, ForeignKey('account_roles.id'), nullable=False)

    @classmethod
    def create_account_role(cls, data, session=None) -> AccountUserRole:
        """Create account role."""
        account_role = AccountUserRole(
            account_user_id=data.get('account_user_id', None),
            role_id=data.get('role_id', None),
        )
        if session:
            session.add(account_role)
            session.commit()
        else:
            account_role.save()
        return account_role
