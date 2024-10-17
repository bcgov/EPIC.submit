"""Submission package model class.

Manages the package
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, Enum, ForeignKey
from sqlalchemy.orm import joinedload

from .base_model import BaseModel
from .db import db


class PackageStatus(enum.Enum):
    """Enum for package statuses."""

    IN_REVIEW = 'IN_REVIEW'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    SUBMITTED = 'SUBMITTED'
    PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED'
    COMPLETED = 'COMPLETED'
    NEW_SUBMISSION = 'NEW_SUBMISSION'


class Package(BaseModel):
    """Definition of the package entity."""

    __tablename__ = 'packages'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_project_id = Column(db.Integer, ForeignKey('account_projects.id'), nullable=False)
    name = Column(db.String(255), nullable=False)
    type_id = Column(db.Integer, ForeignKey('package_types.id'), nullable=False)
    type = db.relationship('PackageType', foreign_keys=[type_id], lazy='joined')
    submitted_on = Column(db.DateTime, nullable=True)
    submitted_by = Column(db.String(255), nullable=True)
    submitted_by_account_user = db.relationship(
        'AccountUser',
        primaryjoin="foreign(Package.submitted_by) == AccountUser.auth_guid",
        lazy='joined'
    )
    meta = db.relationship('PackageMetadata', backref='package', lazy='select')
    items = db.relationship('Item', backref='package', lazy='joined', order_by='Item.sort_order')
    status = Column(db.ARRAY(Enum(PackageStatus)), nullable=False, default=[PackageStatus.NEW_SUBMISSION.value])

    @classmethod
    def get_package_by_id_with_items(cls, package_id: int):
        """Return model by package id."""
        return cls.query.filter_by(id=package_id).options(joinedload(Package.items)).first()
