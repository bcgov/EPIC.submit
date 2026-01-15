"""Proponent model class.

Manages the proponent entity.
"""
from __future__ import annotations

from sqlalchemy import Column, String, Integer, Boolean, Enum as SQLEnum

from .account import Account
from .account_project import AccountProject
from .db import db
from .invitations import Invitations
from .project import Project
from ..enums.invitation_status import InvitationStatus
from ..enums.proponent_status import ProponentStatus


class Proponent(db.Model):
    """Definition of the Proponent entity."""

    __tablename__ = 'proponents'

    id = Column(Integer, primary_key=True, autoincrement=False)
    name = Column(String(), nullable=False)
    status = Column(SQLEnum(ProponentStatus), nullable=True, default=None)
    is_deleted = Column(Boolean, nullable=False, default=False)

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status.value if self.status else None,
            "is_deleted": self.is_deleted,
        }

    @classmethod
    def get_all_proponents(cls, include_deleted=False, approved_conditions_only=None):
        """Get all proponents."""
        query = cls.query

        if approved_conditions_only is True:
            query = query.join(Project, cls.id == Project.proponent_id)
            query = query.filter(Project.has_approved_condition.is_(True))
            query = query.distinct()

        if not include_deleted:
            query = query.filter(cls.is_deleted.is_(False))

        return query.order_by(cls.name).all()

    @classmethod
    def get_proponent_by_id(cls, proponent_id, include_invitations=False, include_projects=False):
        """Get proponent by id.

        Args:
            proponent_id: The id of the proponent to retrieve.
            include_invitations: If True, includes invitations in the response.
            include_projects: If True, includes projects in the response.

        Returns:
            Dictionary with proponent data, or None if not found.
        """
        proponent = cls.query.filter_by(id=proponent_id, is_deleted=False).first()
        if not proponent:
            return None

        proponent_dict = {
            "id": proponent.id,
            "name": proponent.name,
            "status": proponent.status.value if proponent.status else None
        }
        if not include_invitations and not include_projects:
            return proponent_dict

        accounts_ids = Account.query.with_entities(Account.id).filter_by(proponent_id=proponent_id).all()
        accounts_ids = [account_id for account_id, in accounts_ids]

        if include_invitations and accounts_ids:
            invitations = Invitations.query.filter(
                Invitations.account_id.in_(accounts_ids),
                Invitations.status.in_([InvitationStatus.PENDING.value, InvitationStatus.USED.value])
            ).all()
            proponent_dict["invitations"] = [invitation.to_dict() for invitation in invitations]

        if include_projects:
            projects = Project.query.filter_by(proponent_id=proponent_id).order_by(Project.name).all()
            proponent_dict["projects"] = [project.to_dict() for project in projects]
            account_projects = AccountProject.query.filter(AccountProject.account_id.in_(accounts_ids)).all()
            proponent_dict["account_projects"] = [{
                "id": account_project.id,
                "account_id": account_project.account_id,
                "project_id": account_project.project_id,
            } for account_project in account_projects]

        return proponent_dict
