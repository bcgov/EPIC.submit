"""Submission package model class.

Manages the package metadata
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class PackageMetadata(BaseModel):
    """Definition of the package entity."""

    __tablename__ = 'package_metadata'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    package_id = Column(db.Integer, ForeignKey('packages.id'), nullable=False)
    package_meta = Column(db.JSON, nullable=False)
