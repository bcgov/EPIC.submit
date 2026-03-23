"""Service for proponent management."""
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.enums.proponent_status import ProponentStatus
from submit_api.models.account_project_work import AccountProjectWork
from submit_api.models.account_project import AccountProject
from submit_api.models.account_user import AccountUser
from submit_api.models.account import Account
from submit_api.models.db import session_scope
from submit_api.models.proponent import Proponent
from submit_api.models.track_work import TrackWork
from submit_api.services.invitation_service import InvitationService
from submit_api.services.account_user_service import AccountUserService
from submit_api.enums.role import RoleEnum


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
        return Proponent.get_proponent_by_id(
            proponent_id,
            include_invitations=include_invitations,
            include_projects=include_projects,
            include_administrators=include_administrators,
        )

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
