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
    submitted_document_id = Column(db.Integer, ForeignKey('submitted_documents.id'), nullable=True)
    submitted_form = db.relationship('SubmittedForm', foreign_keys=[submitted_form_id], lazy='joined')
    submitted_document = db.relationship('SubmittedDocument', foreign_keys=[submitted_document_id], lazy='joined')
    version = Column(db.Integer, nullable=False, default=1)
    user = db.relationship(
        'User',
        primaryjoin="foreign(Submission.created_by) == User.auth_guid",
        lazy='joined'
    )

    Index('idx_submissions_type_item_id', type, item_id)

    @classmethod
    def find_latest_by_type_and_item_id(cls, item_id: int, submission_type: SubmissionTypeStatus):
        """Return model by item id."""
        return cls.query.filter_by(item_id=item_id, type=submission_type).order_by(cls.created_date.asc()).first()
