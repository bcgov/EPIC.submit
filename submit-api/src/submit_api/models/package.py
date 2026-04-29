"""Submission package model class.

Manages the package
"""
from __future__ import annotations

import enum

from sqlalchemy import Column, Enum, ForeignKey
from sqlalchemy.orm import joinedload

from .package_version import PackageVersion
from .base_model import BaseModel
from .db import db


class NonCanonicalPackageStatus(enum.Enum):
    """Enum for non-canonical package statuses."""

    UPDATED = "UPDATED"
    UPDATE_REQUESTED = "UPDATE_REQUESTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    REVISION_REQUIRED = "REVISION_REQUIRED"

    @classmethod
    def check_value(cls, value):
        """Check if a value is a valid non-canonical package status."""
        for member in cls:
            if member.value == value:
                return member
        return None


class PackageStatus(enum.Enum):
    """Enum for package statuses."""

    IN_REVIEW = 'IN_REVIEW'
    APPROVED = 'APPROVED'
    ACCEPTED = 'ACCEPTED'
    SATISFIED = 'SATISFIED'
    REJECTED = 'REJECTED'
    REVIEWED = 'REVIEWED'
    SUBMITTED = 'SUBMITTED'
    PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED'
    COMPLETED = 'COMPLETED'
    NEW_SUBMISSION = 'NEW_SUBMISSION'
    NEW = 'NEW'
    IN_PROGRESS = 'IN_PROGRESS'
    PASSED_CONSULTATION_CHECK = 'PASSED_CONSULTATION_CHECK'
    FAILED_CONSULTATION_CHECK = 'FAILED_CONSULTATION_CHECK'
    UNDER_REVIEW = 'UNDER_REVIEW'
    UNDER_CONSULTATION_CHECK = 'UNDER_CONSULTATION_CHECK'
    REVIEW_REJECTED = 'REVIEW_REJECTED'
    REVIEW_NOT_COMPLETED = 'REVIEW_NOT_COMPLETED'
    CREATED = 'CREATED'
    AWAITING_MANAGER_APPROVAL = 'AWAITING_MANAGER_APPROVAL'
    CC_AWAITING_MANAGER_APPROVAL = 'CC_AWAITING_MANAGER_APPROVAL'
    MP_AWAITING_MANAGER_APPROVAL = 'MP_AWAITING_MANAGER_APPROVAL'
    IEM_AWAITING_MANAGER_APPROVAL = 'IEM_AWAITING_MANAGER_APPROVAL'
    REVISION_REQUIRED = 'REVISION_REQUIRED'
    NO_REVISION_REQUIRED = 'NO_REVISION_REQUIRED'
    RESUBMITTED = 'RESUBMITTED'
    REQUESTED_BY_EAO = 'REQUESTED_BY_EAO'

    @classmethod
    def check_value(cls, value):
        """Check if a value is a valid package status."""
        for member in cls:
            if member.value == value:
                return member
        return None


class Package(BaseModel):
    """Definition of the package entity."""

    __tablename__ = 'packages'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_project_id = Column(db.Integer, ForeignKey(
        'account_projects.id', ondelete='CASCADE'), nullable=False)
    name = Column(db.String(255), nullable=False)
    description = Column(db.String(500), nullable=True, comment="Description of the package")
    type_id = Column(db.Integer, ForeignKey(
        'package_types.id'), nullable=False)
    type = db.relationship('PackageType', foreign_keys=[
                           type_id], lazy='joined')
    account_project_work_id = Column(db.Integer, ForeignKey(
        'account_project_works.id', ondelete='SET NULL'), nullable=True)
    account_project_work = db.relationship('AccountProjectWork', foreign_keys=[
                           account_project_work_id], lazy='joined', back_populates='packages')
    submitted_on = Column(db.DateTime, nullable=True)
    submitted_by = Column(db.String, ForeignKey(
        'users.auth_guid', name='packages_submitted_by_fkey'), nullable=True)
    submitted_by_user = db.relationship(
        'User', foreign_keys=[submitted_by], lazy='joined')
    completed_on = Column(db.DateTime, nullable=True)
    meta = db.relationship(
        'PackageMetadata', backref='package', lazy='joined', uselist=False, cascade='all, delete', passive_deletes=True)
    items = db.relationship('Item', backref='package',
                            lazy='select', order_by='Item.sort_order', cascade='all, delete', passive_deletes=True)
    status = Column(db.ARRAY(Enum(PackageStatus)), nullable=False,
                    default=[PackageStatus.NEW.value])
    active = Column(db.Boolean, nullable=False, default=True)
    version_id = Column(db.Integer, ForeignKey(
        'package_versions.id'), nullable=True)
    version = db.relationship('PackageVersion', foreign_keys=[
                              version_id], lazy='joined')

    __table_args__ = (
        db.Index('idx_packages_account_project_id', 'account_project_id'),
        db.Index('idx_packages_account_project_work_id', 'account_project_work_id',
                 postgresql_where=db.text('account_project_work_id IS NOT NULL')),
    )

    _update_requests = db.relationship(
        'UpdateRequest',
        backref='package',
        lazy='joined')

    internal_staff_documents = db.relationship('InternalStaffDocument',
                                               backref='package',
                                               lazy='joined',
                                               cascade='all, delete',
                                               passive_deletes=True)

    @property
    def update_requests(self):
        """Get the active update requests for the package."""
        return [ur for ur in self._update_requests if ur.active]

    @property
    def all_update_requests(self):
        """Get all update requests for the package."""
        return self._update_requests

    @classmethod
    def get_package_by_id_with_items(cls, package_id: int):
        """Return model by package id."""
        return cls.query.filter_by(id=package_id).options(joinedload(Package.items)).first()

    @classmethod
    def get_all_package_by_ids(cls, package_ids: list[int]):
        """Return model by package ids."""
        return cls.query.filter(Package.id.in_(package_ids)).all()

    @classmethod
    def get_all_latest_packages_by_original_package_ids(cls, original_package_ids: list[int]):
        """Return all packages with the greatest PackageVersion.version by original package ids."""
        subquery = (db.session.query(
            PackageVersion.original_package_id,
            db.func.max(PackageVersion.version).label('max_version')
        ).filter(PackageVersion.original_package_id.in_(original_package_ids))
                    .group_by(PackageVersion.original_package_id).subquery())

        return cls.query.join(PackageVersion).join(
            subquery,
            (PackageVersion.original_package_id == subquery.c.original_package_id) &
            (PackageVersion.version == subquery.c.max_version)
        ).all()

    @classmethod
    def get_account_project_id_by_package_id(cls, package_id: int) -> int | None:
        """Return only the account_project_id for a given package id."""
        result = db.session.query(cls.account_project_id).filter(cls.id == package_id).scalar()
        return result
