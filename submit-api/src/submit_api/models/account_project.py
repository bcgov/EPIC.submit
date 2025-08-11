"""Account Project model class.

Manages the account project
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey

from .base_model import BaseModel
from .db import db


class AccountProject(BaseModel):
    """Definition of the Account Project entity."""

    __tablename__ = 'account_projects'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    account_id = Column(db.Integer, ForeignKey('accounts.id'), nullable=False)
    project_id = Column(db.Integer, ForeignKey('projects.id'), nullable=False)
    project = db.relationship('Project', foreign_keys=[project_id], lazy='joined')
    packages = db.relationship(
        'Package',
        primaryjoin='Package.account_project_id==AccountProject.id',
        lazy='select')

    @property
    def latest_packages(self):
        """Get the latest packages by versions for the account project."""
        version_by_package = {}

        for package in self.packages:
            original_package_id = package.version.original_package_id
            if original_package_id not in version_by_package:
                version_by_package[original_package_id] = package
            else:
                if package.version.version > version_by_package[original_package_id].version.version:
                    version_by_package[original_package_id] = package

        return list(version_by_package.values())

    @classmethod
    def add_projects_bulk(cls, projects):
        """Add projects in bulk."""
        db.session.bulk_insert_mappings(cls, projects)
        db.session.commit()
        return projects

    @classmethod
    def get_all(cls):
        """Get all projects."""
        return cls.query.all()

    @classmethod
    def get_by_account_id(cls, account_id: int) -> AccountProject | None:
        """Return the AccountProject object for the given account_id."""
        return cls.query.filter_by(account_id=account_id).first()

    @classmethod
    def create_account_project(cls, account_id, project_id, session=None) -> AccountProject:
        """Create account project."""
        existing_account_project = cls.query.filter_by(
            account_id=account_id,
            project_id=project_id
        ).first()
        if existing_account_project:
            return existing_account_project
        account_project = AccountProject(
            account_id=account_id,
            project_id=project_id
        )
        if session:
            session.add(account_project)
        else:
            account_project.save()
        return account_project
