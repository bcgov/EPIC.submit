"""Account Project model class.

Manages the account project
"""
from __future__ import annotations

from sqlalchemy import Column

from .account_project import AccountProject
from .account import Account
from .invitations import Invitations
from .db import db
from ..enums.invitation_status import InvitationStatus


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

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "proponent_id": self.proponent_id,
            "proponent_name": self.proponent_name,
            "ea_certificate": self.ea_certificate,
            "epic_guid": self.epic_guid,
        }

    @classmethod
    def get_all_projects_in_ids(cls, project_ids):
        """Get all projects in the given project ids."""
        return cls.query.filter(cls.id.in_(project_ids)).all()

    @classmethod
    def get_one_by_proponent_id(cls, proponent_id):
        """Fetch project by proponent id."""
        return cls.query.filter_by(proponent_id=proponent_id).first()

    @classmethod
    def get_all_proponents(cls):
        """Get all proponents."""
        proponents = (cls.query.with_entities(cls.proponent_id, cls.proponent_name)
                      .distinct().order_by(cls.proponent_name).all())
        return proponents

    @classmethod
    def get_proponent_by_id(cls, proponent_id, include_invitations=False, include_projects=False):
        """Get all proponents."""
        proponent = cls.query.filter_by(proponent_id=proponent_id).first()
        if not proponent:
            return None

        proponent_dict = {
            "id": proponent.proponent_id,
            "name": proponent.proponent_name,
        }

        if include_invitations:
            account = Account.query.filter_by(proponent_id=proponent_id).first()
            if account:
                invitations = Invitations.query.filter_by(account_id=account.id, status=InvitationStatus.PENDING.value).all()
                proponent_dict["invitations"] = [invitation.to_dict() for invitation in invitations]
            if include_projects:
                account_projects = AccountProject.query.filter_by(account_id=account.id).all()
                proponent_dict["account_projects"] = [account_project.project.to_dict() for account_project in account_projects]

        if include_projects:
            projects = cls.query.filter_by(proponent_id=proponent_id).all()
            proponent_dict["projects"] = [project.to_dict() for project in projects]
        return proponent_dict
