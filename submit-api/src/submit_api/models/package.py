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
    is_latest = Column(db.Boolean, nullable=False, default=True)

    update_requests = db.relationship(
        'UpdateRequest',
        backref='submission_package',
        lazy='joined',
        primaryjoin='and_(UpdateRequest.submission_package_id == Package.id, UpdateRequest.active.is_(True))',
        foreign_keys='UpdateRequest.submission_package_id')

    version = db.relationship(
        'PackageVersion',
        backref='package',
        lazy='select',
        uselist=False,
        primaryjoin='Package.id == PackageVersion.package_id',
        foreign_keys='PackageVersion.package_id')

    @classmethod
    def get_package_by_id_with_items(cls, package_id: int):
        """Return model by package id."""
        return cls.query.filter_by(id=package_id).options(joinedload(Package.items)).first()

    @classmethod
    def get_all_by_package_ids(cls, package_ids: list):
        """Return all packages by package ids."""
        return cls.query.filter(cls.id.in_(package_ids)).all()
