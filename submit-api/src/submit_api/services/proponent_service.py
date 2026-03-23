"""Service for proponent management."""
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.enums.invitation_status import InvitationStatus
from submit_api.enums.proponent_status import ProponentStatus
from submit_api.enums.role import RoleEnum
from submit_api.models.account_project import AccountProject
from submit_api.models.account_project_work import AccountProjectWork
from submit_api.models.account_user import AccountUser
from submit_api.models.account import Account
from submit_api.models.db import session_scope
from submit_api.models.invitations import Invitations
from submit_api.models.project import Project
from submit_api.models.proponent import Proponent
from submit_api.models.track_work import TrackWork
from submit_api.services.invitation_service import InvitationService
from submit_api.services.account_user_service import AccountUserService


class ProponentService:
    """Proponent management service."""

    @classmethod
    def get_proponent(
        cls,
        proponent_id,
        include_invitations=False,
        include_projects=False,
        include_administrators=False,
    ):
        """Get proponent by id."""
        proponent = Proponent.get_by_id(proponent_id)
        if not proponent:
            return None

        proponent_dict = proponent.to_dict()

        if not include_invitations and not include_projects and not include_administrators:
            return proponent_dict

        account_ids = account_ids = [
            account_id
            for account_id, in Account.query.with_entities(Account.id).filter_by(proponent_id=proponent_id).all()
        ]

        if include_invitations and account_ids:
            proponent_dict["invitations"] = cls._get_invitations(account_ids)

        if include_projects:
            proponent_dict.update(cls._get_projects(proponent_id, account_ids))

        if include_administrators and account_ids:
            proponent_dict["administrators"] = cls._get_administrators(account_ids)

        return proponent_dict

    @classmethod
    def _get_invitations(cls, account_ids) -> list:
        """Fetch pending and used invitations for the given account IDs."""
        invitations = Invitations.query.filter(
            Invitations.account_id.in_(account_ids),
            Invitations.status.in_([InvitationStatus.PENDING.value, InvitationStatus.USED.value])
        ).all()
        return [invitation.to_dict() for invitation in invitations]

    @classmethod
    def _get_projects(cls, proponent_id, account_ids) -> dict:
        """Fetch projects and account projects for a proponent."""
        projects = Project.query.filter_by(proponent_id=proponent_id).order_by(Project.name).all()
        account_projects = AccountProject.query.filter(
            AccountProject.account_id.in_(account_ids)
        ).all()
        return {
            "projects": [project.to_dict() for project in projects],
            "account_projects": [
                {
                    "id": ap.id,
                    "account_id": ap.account_id,
                    "project_id": ap.project_id,
                }
                for ap in account_projects
            ],
        }

    @classmethod
    def _get_administrators(cls, account_ids) -> list:
        """Fetch primary administrators for the given account IDs."""
        account_users = AccountUser.query.filter(
            AccountUser.account_id.in_(account_ids)
        ).all()
        return cls._build_administrators(account_users)

    @classmethod
    def _build_administrators(cls, account_users) -> list:
        """Filter account users down to active primary admins and format them."""
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

    @classmethod
    def get_all_proponents(cls, include_deleted=False, approved_conditions_only=None):
        """Get all proponents from the Proponent table."""
        return Proponent.get_all_proponents(
            include_deleted=include_deleted,
            approved_conditions_only=approved_conditions_only
        )

    @classmethod
    def add_eligible_account_projects(cls, proponent_id, proponent_data):
        """Add eligible projects for proponent id."""
        project_ids = proponent_data.get("projects")

        proponent = Proponent.find_by_id(proponent_id)

        if not proponent:
            raise ResourceNotFoundError(f"Proponent with id {proponent_id} not found")
        if proponent.status is not ProponentStatus.ONBOARDED:
            raise BadRequestError("Can only enable projects for onboarded proponents.")

        account = Account.get_by_proponent_id(proponent_id)
        account_users = AccountUser.get_users_by_account_id(account.id)

        with session_scope() as session:
            # Create account projects if they don't exist
            InvitationService.get_or_create_account_projects(
                account.id, project_ids, session)

            account_projects = AccountProject.get_all_in_project_ids(project_ids)

            for account_project in account_projects:
                # Assign user role(s)
                for account_user in account_users:
                    user_role = getattr(account_user, "role", None)
                    if (
                        user_role and
                        user_role.role.role_name in [
                            RoleEnum.ACCOUNT_PRIMARY_ADMIN.value,
                            RoleEnum.PROJECT_ADMIN.value
                        ] and
                        user_role.active
                    ):
                        AccountUserService.assign_role({
                            "account_user_id": account_user.id,
                            "role_id": user_role.role.id,
                            "account_project_id": account_project.id,
                        }, session)

                # Create account_project_works
                works = TrackWork.find_by_project_id(account_project.project_id)
                for work in works:
                    AccountProjectWork.get_or_create(account_project.id, work.id)
            session.flush()
