"""Account Project model class.

Manages the account project
"""
from __future__ import annotations

from sqlalchemy import Column, event
from sqlalchemy.exc import ArgumentError, IntegrityError

from submit_api.exceptions import PermissionDeniedError

from .db import db


class Project(db.Model):
    """Definition of the Project entity."""

    __tablename__ = 'projects'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(), nullable=False)
    proponent_id = Column(db.Integer(), nullable=False, unique=True)
    proponent_name = Column(db.String(), nullable=False)
    ea_certificate = Column(db.String(255), nullable=True, default=None)
    epic_guid = Column(db.String(255), nullable=True, default=None)

    __table_args__ = (
        db.Index('ix_projects_proponent_id', 'proponent_id'),
    )

    def __init__(self, **kwargs):
        """Initialize the Project entity."""
        raise ArgumentError("Project is read-only, cannot create new instances.")

    @classmethod
    def get_all_projects_in_ids(cls, project_ids):
        """Get all projects in the given project ids."""
        return cls.query.filter(cls.id.in_(project_ids)).all()

    @classmethod
    def get_one_by_proponent_id(cls, proponent_id):
        """Fetch project by proponent id."""
        return cls.query.filter_by(proponent_id=proponent_id).first()


@event.listens_for(Project, 'before_insert')
def before_insert():
    """Raise an error when trying to insert into the Project table."""
    raise IntegrityError(
        "Insertions are not allowed on this table",
        params=None,
        orig=PermissionDeniedError('Insertions are not allowed on this table')
    )


@event.listens_for(Project, 'before_update')
def before_update():
    """Raise an error when trying to update the Project table."""
    raise IntegrityError(
        "Updates are not allowed on this table",
        params=None,
        orig=PermissionDeniedError('Updates are not allowed on this table')
    )


@event.listens_for(Project, 'before_delete')
def before_delete():
    """Raise an error when trying to delete from the Project table."""
    raise IntegrityError(
        "Deletions are not allowed on this table",
        params=None,
        orig=PermissionDeniedError('Deletions are not allowed on this table')
    )
