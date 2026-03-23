"""Account Project Work model class.

Manages the junction between account projects and works
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, UniqueConstraint

from .base_model import BaseModel
from .db import db


class AccountProjectWork(BaseModel):
    """Definition of the Account Project Work entity.

    Junction table linking account projects to specific works.
    """

    __tablename__ = 'account_project_works'
    __table_args__ = (
        UniqueConstraint('account_project_id', 'work_id', name='uq_account_project_work'),
        db.Index('idx_account_project_works_account_project_id', 'account_project_id'),
        db.Index('idx_account_project_works_work_id', 'work_id'),
    )

    id = Column(
        db.Integer, primary_key=True, autoincrement=True,
        comment='Unique identifier for account project work association'
    )
    account_project_id = Column(
        db.Integer, ForeignKey('account_projects.id', ondelete='CASCADE'),
        nullable=False, comment='Account project ID'
    )
    work_id = Column(
        db.Integer, ForeignKey('track_works.id'),
        nullable=False, comment='Work ID from EPIC.track'
    )
    is_active = Column(
        db.Boolean, nullable=False, default=True,
        comment='Whether this association is currently active'
    )

    account_project = db.relationship(
        'AccountProject',
        foreign_keys=[account_project_id],
        lazy='joined',
        back_populates='account_project_works')

    work = db.relationship('TrackWork', foreign_keys=[work_id], lazy='joined')

    packages = db.relationship(
        'Package',
        primaryjoin='Package.account_project_work_id==AccountProjectWork.id',
        lazy='select',
        cascade='all, delete',
        passive_deletes=True,
        back_populates='account_project_work')

    @classmethod
    def find_by_account_project_id(cls, account_project_id: int):
        """Return account project works by account project id."""
        return cls.query.filter_by(account_project_id=account_project_id, is_active=True).all()

    @classmethod
    def find_by_work_id(cls, work_id: int):
        """Return account project works by work id."""
        return cls.query.filter_by(work_id=work_id, is_active=True).all()

    @classmethod
    def get_or_create(cls, account_project_id: int, work_id: int, session=None):
        """Create or get account project work.

        Args:
            account_project_id: ID of the account project
            work_id: ID of the work
            session: Optional database session

        Returns:
            AccountProjectWork: The created or existing instance
        """
        existing = cls.query.filter_by(
            account_project_id=account_project_id,
            work_id=work_id
        ).first()

        if existing:
            if not existing.is_active:
                existing.is_active = True
                if session:
                    session.add(existing)
                else:
                    existing.save()
            return existing

        new_instance = cls(
            account_project_id=account_project_id,
            work_id=work_id,
            is_active=True
        )

        if session:
            session.add(new_instance)
        else:
            new_instance.save()

        return new_instance
