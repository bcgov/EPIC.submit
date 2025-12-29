"""Internal staff document model class.

Manages the internal staff
"""
from __future__ import annotations

import enum

from sqlalchemy import Column

from .base_model import BaseModel
from .db import db


class InternalStaffDocumentType(enum.Enum):
    """Enum for submission type."""

    S3 = 'S3'
    LINK = 'LINK'


class InternalStaffDocument(BaseModel):
    """Definition of the submitted documents entity."""

    __tablename__ = 'internal_staff_documents'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    url = Column(db.String(), nullable=False)
    type = Column(db.Enum(InternalStaffDocumentType), nullable=False)
    package_id = Column(
        db.Integer,
        db.ForeignKey('packages.id', name='internal_staff_documents_package_id_fkey', ondelete='CASCADE'),
        nullable=False
    )
    created_by = Column(
        db.String,
        db.ForeignKey('users.auth_guid', name='internal_staff_documents_created_by_fkey'),
        nullable=True
    )
    created_by_user = db.relationship('User', foreign_keys=[created_by], lazy='joined')
