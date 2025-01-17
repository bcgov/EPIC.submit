"""Submission package version model class.

Manages the package
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, func

from .db import db


class PackageVersion(db.Model):
    """Definition of the package entity."""

    __tablename__ = 'package_versions'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    original_package_id = Column(db.Integer, nullable=False)
    version = Column(db.Integer, nullable=False)

    __table_args__ = (
        db.Index('idx_package_versions_original_package_id', original_package_id),
        db.UniqueConstraint('version', 'original_package_id'),
    )

    @classmethod
    def get_by_package_id(cls, package_id: int):
        """Return model by package id."""
        return cls.query.filter_by(package_id=package_id).first()

    @classmethod
    def get_by_id(cls, _id: int):
        """Return model by package id."""
        return cls.query.filter_by(id=_id).first()

    @classmethod
    def get_all_by_original_package_id(cls, original_package_id: int):
        """Return all package versions by original package id, sorted by version in decreasing order."""
        return cls.query.filter_by(original_package_id=original_package_id).order_by(cls.version.desc()).all()
