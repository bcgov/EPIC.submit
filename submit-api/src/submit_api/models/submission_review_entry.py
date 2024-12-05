"""Review model class.

Manages the review
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class SubmissionReviewEntryType(enum.Enum):
    """Enum for submission review statuses."""

    STAFF_RECOMMENDATION = 'STAFF_RECOMMENDATION'
    MANAGER_CONFIRMATION = 'MANAGER_CONFIRMATION'


class SubmissionReviewEntry(BaseModel):
    """Definition of the review submission entity."""

    __tablename__ = 'submission_review_entries'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    review_id = Column(db.Integer, ForeignKey('submission_reviews.id'), nullable=False)
    type = Column(db.Enum(SubmissionReviewEntryType), nullable=False)
    created_by = Column(db.String, ForeignKey('users.auth_guid'), nullable=True)
    created_by_user = db.relationship('User', foreign_keys=[created_by], lazy='joined')
    entry = Column(db.JSON, nullable=False)

    __table_args__ = (
        db.Index('review_submissions_review_id_idx', review_id),
    )

    @classmethod
    def get_review_entry_by_id_and_type(cls, review_id, entry_type):
        """Get review entry by id and type."""
        return cls.query.filter_by(review_id=review_id, type=entry_type).first()
