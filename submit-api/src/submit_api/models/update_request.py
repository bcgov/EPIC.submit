"""Update request model class.

Manages the update request
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, ForeignKey, Enum

from .base_model import BaseModel
from .db import db


class UpdateRequestType(enum.Enum):
    """Enum for update request statuses."""

    REVIEW = 'REVIEW'
    UPDATE = 'UPDATE'


class UpdateRequestStatus(enum.Enum):
    """Enum for update request statuses."""

    OPEN = 'OPEN'
    PENDING_REVIEW = 'PENDING_REVIEW'
    CLOSED = 'CLOSED'
    ACCEPTED = 'ACCEPTED'


class UpdateRequest(BaseModel):
    """Definition of update request entity."""

    __tablename__ = 'update_requests'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    submission_package_id = Column(db.Integer, ForeignKey('packages.id', ondelete='CASCADE'), nullable=False,)
    submission_item_types = Column(db.ARRAY(db.Integer), nullable=False, comment='Array of submission item type IDs')
    active = Column(db.Boolean, nullable=False, default=True)
    created_by = Column(db.String, ForeignKey('users.auth_guid'), nullable=False)
    created_by_user = db.relationship('User', foreign_keys=[created_by], lazy='joined')
    reason = Column(db.String, nullable=True)
    type = Column(Enum(UpdateRequestType), nullable=False, default=UpdateRequestType.UPDATE)
    note = Column(db.String, nullable=True)
    note_updated_by = Column(db.String, ForeignKey('users.auth_guid'),
                             nullable=True,
                             comment='Proponent user who last updated the note')
    note_updated_by_user = db.relationship('User', foreign_keys=[note_updated_by], lazy='joined')
    note_updated_at = Column(db.DateTime, nullable=True, comment='Timestamp when the note was last updated')
    status = Column(db.String, nullable=False, default=UpdateRequestStatus.OPEN.value)
