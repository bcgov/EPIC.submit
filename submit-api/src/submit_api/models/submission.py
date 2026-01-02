"""Submission model class.

Manages the submission
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, Enum, ForeignKey, Index

from .base_model import BaseModel
from .db import db


class SubmissionType(enum.Enum):
    """Enum for submission type."""

    FORM = 'FORM'
    DOCUMENT = 'DOCUMENT'
    BUSINESS_DATA = 'BUSINESS_DATA'


class SubmissionStatus(enum.Enum):
    """Enum for submission status."""

    SUBMITTED = 'SUBMITTED'
    REJECTED = 'REJECTED'
    APPROVED = 'APPROVED'
    PENDING = 'PENDING'


class Submission(BaseModel):
    """Definition of the submission entity."""

    __tablename__ = 'submissions'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    submitted_form_id = Column(db.Integer, ForeignKey('submitted_forms.id'), nullable=True)
    item_id = Column(db.Integer, ForeignKey('items.id', ondelete='CASCADE'), nullable=False)
    type = Column(Enum(SubmissionType), nullable=False)
    submitted_document_id = Column(db.Integer, ForeignKey('submitted_documents.id'), nullable=True)
    submitted_form = db.relationship('SubmittedForm', foreign_keys=[submitted_form_id], lazy='joined')
    submitted_document = db.relationship('SubmittedDocument', foreign_keys=[submitted_document_id], lazy='joined')
    created_by = Column(db.String, ForeignKey('users.auth_guid', name='submissions_created_by_fkey'), nullable=False)
    submitted_by_user = db.relationship('User', foreign_keys=[created_by], lazy='joined')
    major_version = Column(db.Integer, nullable=False, default=1)
    minor_version = Column(db.Integer, nullable=False, default=1)
    active = Column(db.Boolean, nullable=False, default=True)
    deleted = Column(db.Boolean, nullable=False, default=False)
    status = Column(
        Enum(SubmissionStatus, name='submissiontypestatus'),
        nullable=True,
        default=SubmissionStatus.PENDING
    )
    root_submission_id = Column(db.Integer, ForeignKey('submissions.id'),
                                nullable=True)  # the base or root id of submisison

    Index('idx_submissions_type_item_id', type, item_id)

    @property
    def version(self):
        """Return version."""
        return f'{self.major_version}.{self.minor_version}'

    @classmethod
    def find_latest_by_type_and_item_id(cls, item_id: int, submission_type: SubmissionType):
        """Return model by item id."""
        return cls.query.filter_by(item_id=item_id, type=submission_type).order_by(cls.created_date.asc()).first()

    @classmethod
    def find_all_versions(cls, root_submission_id: int):
        """Fetch all versions of a submission given its root submission ID, excluding PENDING."""
        return (cls.query
                .filter_by(root_submission_id=root_submission_id, deleted=False)
                .filter(cls.status != SubmissionStatus.PENDING)
                .order_by(cls.major_version.desc(), cls.minor_version.desc())
                .all())
