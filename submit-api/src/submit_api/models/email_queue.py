"""Email queue model."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List

from sqlalchemy import Column, DateTime

from .base_model import BaseModel
from .db import db


class EmailStatus(Enum):
    """Enum for email status."""

    PENDING = 'PENDING'
    SENT = 'SENT'
    FAILED = 'FAILED'


class EntityType(Enum):
    """Enum for package type."""

    PACKAGE = 'PACKAGE'
    INVITATION = 'INVITATION'


class EmailQueue(BaseModel):
    """Model class for email queue."""

    __tablename__ = 'email_queue'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    entity_id = Column(db.Integer, nullable=False)
    entity_type = Column(db.String(50), nullable=False)
    template_name = Column(db.String(100), nullable=False)
    status = Column(db.String(50), nullable=False, default=EmailStatus.PENDING.value)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(db.String(500), nullable=True)

    @classmethod
    def find_pending(cls):
        """Find all pending emails in the queue.

        Returns:
            list[EmailQueue]: List of pending email queue entries
        """
        return cls.query.filter_by(status=EmailStatus.PENDING.value).all()

    @classmethod
    def find_all(cls) -> List[EmailQueue]:
        """Find all entries in the email queue.

        Returns:
            list[EmailQueue]: List of all email queue entries.
        """
        return cls.query.all()
