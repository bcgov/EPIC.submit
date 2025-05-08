"""Submission item model class.

Manages the item
"""

from __future__ import annotations

from collections import defaultdict
from sqlalchemy import Column, Enum, ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property

from ..enums.item_status import ItemStatus
from .base_model import BaseModel
from .db import db
from submit_api.models.submission import SubmissionStatus, Submission


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
    reviews = db.relationship("SubmissionReview", backref="item", lazy="select")
    notes = db.relationship("SubmissionItemNote", backref="item", lazy="select")
    reviewed_on = Column(db.DateTime, nullable=True)
    review_start_date = Column(db.DateTime, nullable=True)
    submissions = db.relationship(
        "Submission",
        lazy="joined",
        primaryjoin="and_(Submission.item_id == Item.id, Submission.active.is_(True), Submission.deleted.is_(False))",
        order_by="Submission.created_date.asc()",
    )

    # add unique constraint package_id and type_id
    __table_args__ = (db.UniqueConstraint("package_id", "type_id"),)

    @property
    def submitted_submissions(self):
        """Return the latest visible submission for each submission thread."""
        # Query all submissions directly, including inactive ones
        all_submissions = Submission.query.filter_by(
            item_id=self.id,
            deleted=False  # Still filter out deleted ones
        ).order_by(Submission.created_date.asc()).all()

        grouped = defaultdict(list)
        for sub in all_submissions:
            root_id = sub.root_submission_id or sub.id
            grouped[root_id].append(sub)

        result = []
        for group in grouped.values():
            sorted_group = sorted(
                group, key=lambda s: (s.major_version, s.minor_version), reverse=True
            )
            
            # Find the most recent non-PENDING submission
            visible = next(
                (s for s in sorted_group if s.status != SubmissionStatus.PENDING), None
            )
       
            if visible:
                result.append(visible)
              
        return result

    @hybrid_property
    def review(self):
        """Get the active review for the item."""
        return next((review for review in self.reviews if review.active), None)
