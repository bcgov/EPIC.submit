"""Account Project model class.

Manages the account project
"""
from __future__ import annotations

from sqlalchemy import Column

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

    @classmethod
    def get_all_projects_in_ids(cls, project_ids):
        """Get all projects in the given project ids."""
        return cls.query.filter(cls.id.in_(project_ids)).all()

    @classmethod
    def get_one_by_proponent_id(cls, proponent_id):
        """Fetch project by proponent id."""
        return cls.query.filter_by(proponent_id=proponent_id).first()
