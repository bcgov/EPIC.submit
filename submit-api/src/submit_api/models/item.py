"""Submission item model class.

Manages the item
"""

from __future__ import annotations

from sqlalchemy import Column, Enum, ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property

from ..enums.item_status import ItemStatus
from .base_model import BaseModel
from .db import db


class Item(BaseModel):
    """Definition of the item entity."""

    __tablename__ = "items"

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    package_id = Column(db.Integer, ForeignKey("packages.id"), nullable=False)
    type_id = Column(db.Integer, ForeignKey("item_types.id"), nullable=False)
    sort_order = Column(db.Integer, nullable=True, default=0)
    type = db.relationship("ItemType", foreign_keys=[type_id], lazy="joined")
    status = Column(
        Enum(ItemStatus), nullable=False, default=ItemStatus.NEW_SUBMISSION.value
    )
    submitted_on = Column(db.DateTime, nullable=True)
    submitted_by = Column(db.String(255), nullable=True)
    version = Column(db.Integer, nullable=False, default=1)
    internal_staff_documents = db.relationship(
        "InternalStaffDocument", backref="item", lazy="select"
    )
    reviews = db.relationship(
        "SubmissionReview", backref="item", lazy="select")
    notes = db.relationship("SubmissionItemNote",
                            backref="item", lazy="select")
    reviewed_on = Column(db.DateTime, nullable=True)
    review_start_date = Column(db.DateTime, nullable=True)
    submissions = db.relationship(
        "Submission",
        lazy="joined",
        primaryjoin="and_(Submission.item_id == Item.id, Submission.active.is_(True), Submission.deleted.is_(False), Submission.status != 'PENDING_REPLACEMENT')",
        order_by="Submission.created_date.asc()",
    )

    # add unique constraint package_id and type_id
    __table_args__ = (db.UniqueConstraint("package_id", "type_id"),)

    @hybrid_property
    def review(self):
        """Get the active review for the item."""
        return next((review for review in self.reviews if review.active), None)
