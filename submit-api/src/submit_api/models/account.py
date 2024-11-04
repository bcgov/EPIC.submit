"""Account model class.

Manages the account
"""
from __future__ import annotations

from sqlalchemy import Column

from .base_model import BaseModel
from .db import db


class Account(BaseModel):
    """Definition of the Account entity."""

    __tablename__ = 'accounts'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    proponent_id = Column(db.Integer(), nullable=False, unique=True)

    @classmethod
    def get_by_proponent_id(cls, proponent_id) -> Account:
        """Fetch account by proponent id."""
        return cls.query.filter_by(proponent_id=proponent_id).first()

    @classmethod
    def create_account(cls, account_data, session=None) -> Account:
        """Create account."""
        account = Account(
            proponent_id=account_data.get('proponent_id', None),
        )
        if session:
            session.add(account)
            session.commit()
        else:
            account.save()
        return account
