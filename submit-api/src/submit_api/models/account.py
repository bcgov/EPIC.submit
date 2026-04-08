"""Account model class.

Manages the account
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class Account(BaseModel):
    """Definition of the Account entity."""

    __tablename__ = 'accounts'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    proponent_id = Column(db.Integer(), ForeignKey('proponents.id'), nullable=False, unique=True)
    account_users = db.relationship('AccountUser', back_populates='account',
                                    lazy='select', cascade='all, delete', passive_deletes=True)
    proponent = db.relationship('Proponent', foreign_keys=[proponent_id], lazy='joined')

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
        return account.persist(session)

    @classmethod
    def get_ids_by_proponent_id(cls, proponent_id: int) -> list[int]:
        """Get account ids for a given proponent id."""
        results = cls.query.with_entities(cls.id).filter_by(proponent_id=proponent_id).all()
        return [account_id for (account_id,) in results]
