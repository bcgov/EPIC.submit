"""Invitation Token model class.

Manages the invitation tokens for project onboarding.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, UTC

from sqlalchemy import Column, ForeignKey, String, Integer, TIMESTAMP, ARRAY, Boolean, func, and_
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from ..enums.invitation_status import InvitationStatus


class Invitations(BaseModel):
    """Definition of the Invitation Token entity."""

    __tablename__ = 'invitations'

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False)
    project_ids = Column(ARRAY(Integer), nullable=False)
    package_ids = Column(ARRAY(Integer), nullable=True)
    original_package_ids = Column(ARRAY(Integer), nullable=True)  # For original package IDs
    eligible_entries = Column(JSON, nullable=True)  # Structured project/work/non-work selections
    token = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), nullable=True)  # Optional email for client
    status = Column(String(50), default=InvitationStatus.PENDING.value, nullable=False)
    expiry_date = Column(TIMESTAMP, default=datetime.now(UTC))
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_first_time = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    account = relationship('Account', foreign_keys=[account_id], lazy='joined')
    role = relationship('Role', foreign_keys=[role_id], lazy='select')

    @hybrid_property
    def is_expired(self):
        """Check if the invitation has expired based on expiry_date."""
        if self.expiry_date is None:
            return False
        return datetime.now(timezone.utc) > self.expiry_date.replace(tzinfo=timezone.utc)

    @is_expired.expression
    def is_expired(cls):  # noqa: N805  # pylint: disable=no-self-argument
        """SQL expression for is_expired check."""
        return cls.expiry_date < func.timezone('UTC', func.now())  # pylint: disable=not-callable

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "account_id": self.account_id,
            "project_ids": self.project_ids,
            "eligible_entries": self.eligible_entries,
            "package_ids": self.package_ids,
            "original_package_ids": self.original_package_ids,
            "token": self.token,
            "email": self.email,
            "status": self.status,
            "expiry_date": self.expiry_date,
            "role_id": self.role_id,
            "role": self.role.to_dict() if self.role else None,
            "is_expired": self.is_expired,
        }

    @classmethod
    def validate_token(cls, token):
        """Validate token and check if it is still active."""
        invitation = cls.query.filter_by(token=token, status=InvitationStatus.PENDING.value).first()
        if invitation and invitation.expiry_date > datetime.now():
            return invitation
        return None

    @classmethod
    def mark_used(cls, token, used_by, session):
        """Mark an invitation token as used."""
        invitation = cls.query.filter_by(token=token).first()
        if invitation:
            invitation.status = InvitationStatus.USED.value
            invitation.used_by = used_by
            invitation.used_date = datetime.now()
            session.add(invitation)
            session.flush()
            return invitation
        return None

    @staticmethod
    def generate_token():
        """Generate a random secure token."""
        return str(uuid.uuid4())

    @classmethod
    def find_by_token(cls, token: str):
        """Find an invitation by token."""
        return cls.query.filter_by(token=token).first()

    @classmethod
    def find_pending_by_token(cls, token: str):
        """Find a pending invitation by token."""
        return cls.query.filter_by(token=token, status=InvitationStatus.PENDING.value).first()

    @classmethod
    def get_active_by_account_id(cls, account_id: int, project_ids: list = None):
        """Get pending and revoked (non-expired) invitations for an account, optionally filtered by project ids."""
        query = cls.query.filter(
            cls.account_id == account_id,
            # The list should excluded expired and revoked invitations
            # pylint: disable=invalid-unary-operand-type
            ~(and_(cls.is_expired, cls.status == InvitationStatus.REVOKED.value)),
            cls.status.in_([InvitationStatus.PENDING.value, InvitationStatus.REVOKED.value])
        )
        if project_ids:
            query = query.filter(cls.project_ids.op('@>')(project_ids))
        return query.all()

    @classmethod
    def get_all_in_account_ids(cls, account_ids: list[int]):
        """Get pending and used invitations for the given account ids."""
        return cls.query.filter(
            cls.account_id.in_(account_ids),
            cls.status.in_([InvitationStatus.PENDING.value, InvitationStatus.USED.value])
        ).all()
