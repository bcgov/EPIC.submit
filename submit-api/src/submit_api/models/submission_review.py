"""Review model class.

Manages the review
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class SubmissionReviewStatus(enum.Enum):
    """Enum for submission review statuses."""

    PENDING_STAFF_REVIEW = 'PENDING_STAFF_REVIEW'
    PENDING_MANAGER_REVIEW = 'PENDING_MANAGER_REVIEW'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'


class SubmissionReview(BaseModel):
    """Definition of the review entity."""

    __tablename__ = 'submission_reviews'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    item_id = Column(db.Integer, ForeignKey('items.id'), nullable=False)
    form_answers = Column(db.JSON, nullable=False)
    status = Column(db.Enum(SubmissionReviewStatus), nullable=False,
                    default=SubmissionReviewStatus.PENDING_STAFF_REVIEW.value)
    active = Column(db.Boolean, nullable=False, default=True)

    __table_args__ = (
        db.Index('submission_reviews_item_id_idx', item_id),
    )

    @classmethod
    def get_active_review_by_item_id(cls, item_id):
        """Get review by item id."""
        return cls.query.filter_by(item_id=item_id, active=True).first()
