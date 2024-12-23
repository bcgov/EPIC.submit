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
    package_id = Column(db.Integer, ForeignKey('packages.id'), nullable=False)
    original_package_id = Column(db.Integer, ForeignKey('packages.id'), nullable=False)
    version = Column(db.Integer, nullable=False)

    __table_args__ = (
        db.Index('idx_package_versions_original_package_id', original_package_id),
        db.Index('idx_package_versions_package_id', package_id),
        db.UniqueConstraint('version', 'original_package_id'),
    )

    @classmethod
    def get_by_package_id(cls, package_id: int):
        """Return model by package id."""
        return cls.query.filter_by(package_id=package_id).first()

    @classmethod
    def get_all_by_original_package_id(cls, original_package_id: int):
        """Return all package versions by original package id."""
        return cls.query.filter_by(original_package_id=original_package_id).all()

    @classmethod
    def get_latest_versions(cls):
        """Return the latest versions."""
        subquery = (
            db.session.query(
                cls.original_package_id,
                func.max(cls.version).label('max_version')
            )
            .group_by(cls.original_package_id)
            .subquery()
        )

        latest_versions = (
            db.session.query(cls.package_id)
            .join(subquery, db.and_(
                cls.original_package_id == subquery.c.original_package_id,
                cls.version == subquery.c.max_version
            ))
            .all()
        )

        return latest_versions
