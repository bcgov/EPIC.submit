"""Submission package item types model class.

Manages the package item types
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, PrimaryKeyConstraint

from .base_model import BaseModel
from .db import db


class PackageItemType(BaseModel):
    """Definition of the package item type entity."""

    __tablename__ = 'package_item_types'

    package_type_id = Column(db.Integer, ForeignKey(
        'package_types.id'), nullable=False)
    item_type_id = Column(db.Integer, ForeignKey(
        'item_types.id'), nullable=False)
    sort_order = Column(db.Integer, nullable=True, default=0)

    __table_args__ = (
        PrimaryKeyConstraint('package_type_id', 'item_type_id'),
    )

    @classmethod
    def get_by_package_type_id(cls, package_type_id: int) -> list[PackageItemType]:
        """Return all package item types for a given package type."""
        return cls.query.filter_by(package_type_id=package_type_id).all()

    @classmethod
    def delete_by_package_type_id(cls, package_type_id: int) -> None:
        """Delete all package item type associations for a given package type."""
        cls.query.filter_by(package_type_id=package_type_id).delete()
