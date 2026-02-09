"""Service for proponent management."""
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.enums.proponent_status import ProponentStatus
from submit_api.models.account_project import AccountProject
from submit_api.models.account import Account
from submit_api.models.db import session_scope
from submit_api.models.proponent import Proponent


class ProponentService:
    """Proponent management service."""

    @classmethod
    def get_proponent(cls, proponent_id, include_invitations=False, include_projects=False):
        """Get proponent by id."""
        return Proponent.get_proponent_by_id(
            proponent_id,
            include_invitations=include_invitations,
            include_projects=include_projects
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
        if not proponent.status is ProponentStatus.ONBOARDED:
            raise BadRequestError("Can only enable projects for onboarded proponents.")

        account = Account.get_by_proponent_id(proponent_id)

        with session_scope() as session:
            for pid in project_ids:
                AccountProject.create_account_project(account_id=account.id, project_id=pid)
            session.flush()
