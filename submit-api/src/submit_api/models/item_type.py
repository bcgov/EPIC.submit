"""Item types type model class.

Manages the item types
"""

from __future__ import annotations

import enum

from sqlalchemy import Column, Enum
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db


class SubmissionMethod(enum.Enum):
    """Enum for item type input format."""

    FORM_SUBMISSION = 'FORM_SUBMISSION'
    DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD'


class SubmissionItemType(enum.Enum):
    """Enum for item type input format."""

    CONSULTATION_RECORD = 'Consultation Record(s)'
    MANAGEMENT_PLAN_FORM = 'Management Plan'


class ItemType(BaseModel):
    """Definition of the item type entity."""

    __tablename__ = "item_types"

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    submission_method = Column(Enum(SubmissionMethod), nullable=False)
    package_types = relationship('PackageType', secondary='package_item_types', back_populates='item_types')
