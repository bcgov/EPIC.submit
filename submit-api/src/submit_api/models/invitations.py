"""Invitation Token model class.

Manages the invitation tokens for project onboarding.
"""
from __future__ import annotations

from datetime import datetime
import uuid
from sqlalchemy import Column, ForeignKey, String, Integer, TIMESTAMP, ARRAY
from sqlalchemy.orm import relationship

from .base_model import BaseModel


class Invitations(BaseModel):
    """Definition of the Invitation Token entity."""

    __tablename__ = 'invitations'

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=False)
    project_ids = Column(ARRAY(Integer), nullable=False)
    package_ids = Column(ARRAY(Integer), nullable=True)
    token = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), nullable=True)  # Optional email for client
    status = Column(String(50), default='pending', nullable=False)
    expiry_date = Column(TIMESTAMP, default=datetime.utcnow)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)

    account = relationship('Account', foreign_keys=[account_id], lazy='joined')

    @classmethod
    def validate_token(cls, token):
        """Validate token and check if it is still active."""
        invitation = cls.query.filter_by(token=token, status='pending').first()
        if invitation and invitation.expiry_date > datetime.now():
            return invitation
        return None

    @classmethod
    def mark_used(cls, token, used_by, session):
        """Mark an invitation token as used."""
        invitation = cls.query.filter_by(token=token).first()
        if invitation:
            invitation.status = 'used'
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
