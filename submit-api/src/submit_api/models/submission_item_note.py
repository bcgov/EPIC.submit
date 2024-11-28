"""Internal staff document model class.

Manages the internal staff
"""

from __future__ import annotations

from sqlalchemy import Column

from .base_model import BaseModel
from .db import db


class SubmissionItemNote(BaseModel):
    """Definition of the submitted documents entity."""

    __tablename__ = "internal_staff_documents"

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    note = Column(db.String(255), nullable=False)
    item_id = Column(db.Integer, db.ForeignKey("items.id"), nullable=False)
    created_by = Column(db.String, db.ForeignKey("users.auth_guid"), nullable=True)
    created_by_user = db.relationship("User", foreign_keys=[created_by], lazy="joined")
