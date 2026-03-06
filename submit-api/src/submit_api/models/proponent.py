"""Proponent model class.

Manages the proponent entity.
"""
from __future__ import annotations

from sqlalchemy import Column, String, Integer, Boolean, Enum as SQLEnum

from .account import Account
from .account_project import AccountProject
from .account_user import AccountUser
from .base_model import BaseModel
from .invitations import Invitations
from .project import Project
from ..enums.invitation_status import InvitationStatus
from ..enums.proponent_status import ProponentStatus
from ..enums.role import RoleEnum


class Proponent(BaseModel):
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
    def get_proponent_by_id(
        cls,
        proponent_id,
        include_invitations=False,
        include_projects=False,
        include_administrators=False,
    ):
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
        if not include_invitations and not include_projects and not include_administrators:
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

        if include_administrators and accounts_ids:
            proponent_dict["administrators"] = cls._build_administrators(
                AccountUser.query.filter(
                    AccountUser.account_id.in_(accounts_ids)
                ).all()
            )

        return proponent_dict

    @classmethod
    def _build_administrators(cls, account_users):
        """Build administrators list from account users."""
        administrators = []
        for user in account_users:
            user_role = getattr(user, "role", None)
            if not user_role or not user_role.active:
                continue

            if user_role.role.role_name != RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
                continue

            if not user.user_id:
                continue

            administrators.append({
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": user.full_name,
                "position": user.position,
                "company_name": user.company_name,
                "work_contact_number": user.work_contact_number,
                "work_email_address": user.work_email_address,
            })
        return administrators
