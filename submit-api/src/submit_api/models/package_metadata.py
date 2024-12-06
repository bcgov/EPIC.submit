"""Submission package model class.

Manages the package metadata
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class PackageMetadataFields(enum.Enum):
    """Enum for package metadata fields."""

    CONSULTATION_CHECK_COMPLETED_ON = 'cc_completed_on'


class PackageMetadata(BaseModel):
    """Definition of the package entity."""

    __tablename__ = 'package_metadata'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    package_id = Column(db.Integer, ForeignKey('packages.id'), nullable=False, unique=True)
    json = Column(db.JSON)

    # add index on package_id
    __table_args__ = (
        db.Index('idx_package_id', 'package_id'),
    )

    @classmethod
    def get_by_package_id(cls, package_id: int):
        """Return model by package id."""
        return cls.query.filter_by(package_id=package_id).first()
