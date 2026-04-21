"""Account Project model class.

Manages the account project
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey

from .db import db


class Project(db.Model):
    """Definition of the Project entity."""

    __tablename__ = 'projects'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    name = Column(db.String(), nullable=False)
    proponent_id = Column(db.Integer(), ForeignKey('proponents.id'), nullable=False)
    ea_certificate = Column(db.String(255), nullable=True, default=None)
    epic_guid = Column(db.String(255), nullable=True, default=None)
    has_approved_condition = Column(db.Boolean, nullable=True, default=False)

    proponent = db.relationship('Proponent', foreign_keys=[proponent_id], lazy='joined')
    works = db.relationship('TrackWork', back_populates='project', viewonly=True, lazy='select')

    __table_args__ = (
        db.Index('ix_projects_proponent_id', 'proponent_id'),
        db.UniqueConstraint('name', 'proponent_id', name='uq_projects_name_proponent'),
    )

    @property
    def current_work(self):
        """Returns the active in-progress work, preferring the one with the highest id if multiple exist."""
        matching = [w for w in self.works if w.is_active and not w.is_deleted and w.work_state == 'IN_PROGRESS']
        return max(matching, key=lambda w: w.id, default=None)

    @property
    def is_current_phase_enabled(self):
        """Determines if the current active phase is enabled in submit"""
        if not self.current_work or not self.current_work.current_phase:
            return False
        return self.current_work.current_phase.enable_submit    

    @property
    def is_eligible(self):
        """Determines if the current project is eligible in submit."""
        return bool(self.is_current_phase_enabled or self.has_approved_condition)

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "proponent_id": self.proponent_id,
            "proponent": self.proponent.to_dict() if self.proponent else None,
            "works": [work.to_dict() for work in self.works],
            "ea_certificate": self.ea_certificate,
            "epic_guid": self.epic_guid,
            "is_eligible": self.is_eligible
        }

    @classmethod
    def get_all_projects_in_ids(cls, project_ids):
        """Get all projects in the given project ids."""
        return cls.query.filter(cls.id.in_(project_ids)).all()

    @classmethod
    def get_all_by_proponent_id(cls, proponent_id: int):
        """Get all projects for a given proponent id, ordered by name."""
        return cls.query.filter_by(proponent_id=proponent_id).order_by(cls.name).all()

    @classmethod
    def get_one_by_proponent_id(cls, proponent_id):
        """Fetch project by proponent id."""
        return cls.query.filter_by(proponent_id=proponent_id).first()
