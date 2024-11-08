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


class InternalStaffDocuments(BaseModel):
    """Definition of the submitted documents entity."""

    __tablename__ = 'internal_staff_documents'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    url = Column(db.String(), nullable=False)
    type = Column(db.Enum(InternalStaffDocumentType), nullable=False)
    item_id = Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
