"""Invitation Token model class.

Manages the invitation tokens for project onboarding.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, ForeignKey, String, Integer, TIMESTAMP, ARRAY, Boolean
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
    token = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), nullable=True)  # Optional email for client
    status = Column(String(50), default=InvitationStatus.PENDING.value, nullable=False)
    expiry_date = Column(TIMESTAMP, default=datetime.utcnow)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_first_time = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    account = relationship('Account', foreign_keys=[account_id], lazy='joined')
    role = relationship('Role', foreign_keys=[role_id], lazy='select')

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "account_id": self.account_id,
            "project_ids": self.project_ids,
            "package_ids": self.package_ids,
            "original_package_ids": self.original_package_ids,
            "token": self.token,
            "email": self.email,
            "status": self.status,
            "expiry_date": self.expiry_date,
            "role_id": self.role_id,
            "role": self.role.to_dict() if self.role else None,
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
