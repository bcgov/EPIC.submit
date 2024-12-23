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
        primaryjoin='and_(Package.account_project_id==AccountProject.id, Package.active==True)',
        lazy='select')

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
    def get_all_with_latest_packages(cls):
        """Get all projects with latest packages."""
