"""Submission model class.

Manages the submission
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, Enum, ForeignKey, Index

from .base_model import BaseModel
from .db import db


class SubmissionTypeStatus(enum.Enum):
    """Enum for submission type."""

    FORM = 'FORM'
    DOCUMENT = 'DOCUMENT'
    BUSINESS_DATA = 'BUSINESS_DATA'


class Submission(BaseModel):
    """Definition of the submission entity."""

    __tablename__ = 'submissions'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    submitted_form_id = Column(db.Integer, ForeignKey('submitted_forms.id'), nullable=True)
    item_id = Column(db.Integer, ForeignKey('items.id'), nullable=False)
    type = Column(Enum(SubmissionTypeStatus), nullable=False)
    version = Column(db.Integer, nullable=False)

    submitted_document_id = Column(db.Integer, ForeignKey('submitted_documents.id'), nullable=True)

    submitted_form = db.relationship('SubmittedForm', foreign_keys=[submitted_form_id], lazy='select')
    submitted_document = db.relationship('SubmittedDocument', foreign_keys=[submitted_document_id], lazy='select')

    __table_args__ = (
        Index('submission_item_type_version', 'item_id', 'type', 'version', unique=True),
    )

    @classmethod
    def find_latest_by_type(cls, submission_type: SubmissionTypeStatus):
        """Return model by item id."""
        return cls.query.filter_by(type=submission_type).order_by(cls.version.desc()).first()
