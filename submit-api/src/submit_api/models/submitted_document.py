"""Document form model class.

Manages the document
"""
from __future__ import annotations

from enum import Enum

from sqlalchemy import Column

from .base_model import BaseModel
from .db import db


class VirusScanResult(Enum):
    """Internal result of the background document scan."""

    CLEAN = 'CLEAN'
    FAILED = 'FAILED'
    REJECTED = 'REJECTED'


class SubmittedDocument(BaseModel):
    """Definition of the submitted documents entity."""

    __tablename__ = 'submitted_documents'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(255), nullable=False)
    url = Column(db.String(), nullable=False)
    folder = Column(db.String(), nullable=True)
    virus_scan_result = Column(db.String(20), nullable=True)
