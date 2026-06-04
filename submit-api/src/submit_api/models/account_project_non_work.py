"""Account project non-work model class.

Manages the association between account projects and non-work submission items.
"""
from __future__ import annotations

from sqlalchemy import Column, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db
from ..enums.non_work_item import NonWorkItemType


class AccountProjectNonWork(BaseModel):
    """Definition of the account project non-work entity."""

    __tablename__ = 'account_project_non_works'
    __table_args__ = (
        UniqueConstraint('account_project_id', 'non_work_item_type', name='uq_account_project_non_work'),
    )

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_project_id = Column(
        db.Integer,
        ForeignKey('account_projects.id', ondelete='CASCADE'),
        nullable=False
    )
    non_work_item_type = Column(Enum(NonWorkItemType), nullable=False)
    is_active = Column(db.Boolean, nullable=False, default=True)

    # Relationships
    account_project = relationship('AccountProject', back_populates='account_project_non_works')

    @classmethod
    def get_or_create(cls, account_project_id: int, non_work_item_type: NonWorkItemType, session=None):
        """Get or create an account project non-work record."""
        use_session = session or db.session

        existing = cls.query.filter_by(
            account_project_id=account_project_id,
            non_work_item_type=non_work_item_type
        ).first()

        if existing:
            # Reactivate if it was inactive
            if not existing.is_active:
                existing.is_active = True
                use_session.flush()
            return existing

        new_instance = cls(
            account_project_id=account_project_id,
            non_work_item_type=non_work_item_type,
            is_active=True
        )

        return new_instance.persist(use_session)

    @classmethod
    def find_by_account_project_id(cls, account_project_id: int):
        """Find all account project non-work records by account project ID."""
        return cls.query.filter_by(account_project_id=account_project_id).all()

    @classmethod
    def find_active_by_account_project_and_type(
        cls,
        account_project_id: int,
        non_work_item_type: NonWorkItemType
    ):
        """Find active account project non-work record by account project ID and type."""
        return cls.query.filter_by(
            account_project_id=account_project_id,
            non_work_item_type=non_work_item_type,
            is_active=True
        ).first()
