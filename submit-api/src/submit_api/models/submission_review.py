"""Review model class.

Manages the review
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class SubmissionReview(BaseModel):
    """Definition of the review entity."""

    __tablename__ = 'submission_reviews'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    item_id = Column(db.Integer, ForeignKey('items.id'), nullable=False, unique=True)
    form_answers = Column(db.JSON, nullable=False)

    __table_args__ = (
        db.Index('submission_reviews_item_id_idx', item_id),
    )

    @classmethod
    def get_by_item_id(cls, item_id):
        """Get review by item id."""
        return cls.query.filter_by(item_id=item_id).first()
