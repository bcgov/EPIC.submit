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
    PASSED_CONSULTATION_CHECK = 'PASSED_CONSULTATION_CHECK'
    UNDER_REVIEW = 'UNDER_REVIEW'
    UNDER_CONSULTATION_CHECK = 'UNDER_CONSULTATION_CHECK'
    REVIEW_REJECTED = 'REVIEW_REJECTED'
    CREATED = 'CREATED'


class Package(BaseModel):
    """Definition of the package entity."""

    __tablename__ = 'packages'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_project_id = Column(db.Integer, ForeignKey('account_projects.id'), nullable=False)
    name = Column(db.String(255), nullable=False)
    type_id = Column(db.Integer, ForeignKey('package_types.id'), nullable=False)
    type = db.relationship('PackageType', foreign_keys=[type_id], lazy='joined')
    submitted_on = Column(db.DateTime, nullable=True)
    submitted_by = Column(db.String, ForeignKey('users.auth_guid'), nullable=True)
    submitted_by_user = db.relationship('User', foreign_keys=[submitted_by], lazy='joined')
    meta = db.relationship('PackageMetadata', backref='package', lazy='joined', uselist=False)
    items = db.relationship('Item', backref='package', lazy='joined', order_by='Item.sort_order')
    status = Column(db.ARRAY(Enum(PackageStatus)), nullable=False, default=[PackageStatus.NEW_SUBMISSION.value])
    active = Column(db.Boolean, nullable=False, default=True)
    version_id = Column(db.Integer, ForeignKey('package_versions.id'), nullable=True)
    version = db.relationship('PackageVersion', foreign_keys=[version_id], lazy='joined')

    _update_requests = db.relationship(
        'UpdateRequest',
        backref='package',
        lazy='joined')

    @property
    def update_requests(self):
        """Get the active update requests for the package."""
        return [ur for ur in self._update_requests if ur.active]

    @classmethod
    def get_package_by_id_with_items(cls, package_id: int):
        """Return model by package id."""
        return cls.query.filter_by(id=package_id).options(joinedload(Package.items)).first()
