"""Service for proponent management."""
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.enums.proponent_status import ProponentStatus
from submit_api.enums.role import RoleEnum
from submit_api.enums.non_work_item import NonWorkItemType
from submit_api.models.account import Account
from submit_api.models.account_project import AccountProject
from submit_api.models.account_project_work import AccountProjectWork
from submit_api.models.account_project_non_work import AccountProjectNonWork
from submit_api.models.account_user import AccountUser
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
    def get_proponent(cls, proponent_id, **options):
        """Get proponent by id.

        Args:
            proponent_id: The ID of the proponent to retrieve
            **options: Optional flags to include additional data:
                - include_invitations (bool): Include invitation data
                - include_projects (bool): Include project data
                - include_eligibility_entries (bool): Include eligibility entries
                - include_administrators (bool): Include administrator data
        """
        proponent = Proponent.get_by_id(proponent_id)
        if not proponent:
            return None

        proponent_dict = proponent.to_dict()

        include_invitations = options.get('include_invitations', False)
        include_projects = options.get('include_projects', False)
        include_eligibility_entries = options.get('include_eligibility_entries', False)
        include_administrators = options.get('include_administrators', False)

        if not any([include_invitations, include_projects, include_eligibility_entries, include_administrators]):
            return proponent_dict

        account_ids = Account.get_ids_by_proponent_id(proponent_id)

        if include_invitations and account_ids:
            proponent_dict["invitations"] = cls._get_invitations(account_ids)

        if include_projects:
            proponent_dict.update(cls._get_projects(proponent_id, account_ids))

        if include_eligibility_entries:
            proponent_dict.update(cls._get_eligibility_entries(proponent_id, account_ids))

        if include_administrators and account_ids:
            proponent_dict["administrators"] = cls._get_administrators(account_ids)

        return proponent_dict

    @classmethod
    def _get_invitations(cls, account_ids) -> list:
        """Fetch pending and used invitations for the given account IDs."""
        invitations = Invitations.get_all_in_account_ids(account_ids)
        return [invitation.to_dict() for invitation in invitations]

    @classmethod
    def _get_projects(cls, proponent_id, account_ids) -> dict:
        """Fetch projects and account projects for a proponent."""
        projects = Project.get_all_by_proponent_id(proponent_id)
        account_projects = AccountProject.get_all_in_account_ids(account_ids)
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
    def _get_eligibility_entries(cls, proponent_id, account_ids) -> dict:
        """Build eligibility entries from works and non-work items."""
        projects = Project.get_all_by_proponent_id(proponent_id)
        account_projects = AccountProject.get_all_in_account_ids(account_ids)
        # Get onboarded works and non-work items (those in account relations)
        onboarded_works = set()
        onboarded_non_work_items = set()

        for ap in account_projects:
            # Get onboarded works
            apw_list = AccountProjectWork.find_by_account_project_id(ap.id)
            for apw in apw_list:
                if apw.is_active:
                    onboarded_works.add((ap.project_id, apw.work_id))

            # Get onboarded non-work items
            apnw_list = AccountProjectNonWork.find_by_account_project_id(ap.id)
            for apnw in apnw_list:
                if apnw.is_active:
                    onboarded_non_work_items.add((ap.project_id, apnw.non_work_item_type.value))

        eligibility_entries = []

        for project in projects:
            # Add work-based entries (where enable_submit=true)
            for work in project.works:
                if (work.is_active and not work.is_deleted and
                        work.work_state == 'IN_PROGRESS' and
                        work.current_phase and work.current_phase.enable_submit):
                    eligibility_entries.append({
                        "project_id": project.id,
                        "project_name": project.name,
                        "work_id": work.id,
                        "non_work_item_type": None,
                        "current_work": work.title,
                        "current_phase": work.current_phase.display_name or work.current_phase.name,
                        "is_enabled": work.current_phase.enable_submit,
                        "is_onboarded": (project.id, work.id) in onboarded_works
                    })

            # Add management plan entry (if has_approved_condition)
            if project.has_approved_condition:
                eligibility_entries.append({
                    "project_id": project.id,
                    "project_name": project.name,
                    "work_id": None,
                    "non_work_item_type": NonWorkItemType.MANAGEMENT_PLAN.value,
                    "current_work": "Management Plan & Related Documents",
                    "current_phase": "Post Decision",
                    "is_enabled": project.has_approved_condition,
                    "is_onboarded": (project.id, NonWorkItemType.MANAGEMENT_PLAN.value) in onboarded_non_work_items
                })

        return {"eligibility_entries": eligibility_entries}

    @classmethod
    def _get_administrators(cls, account_ids) -> list:
        """Fetch primary administrators for the given account IDs."""
        account_users = AccountUser.get_all_in_account_ids(account_ids)
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
    def _parse_eligibility_entries(cls, eligibility_entry_ids):
        """Parse eligibility entry IDs into project IDs and selections."""
        project_ids = set()
        work_selections = {}
        non_work_selections = {}

        for entry_id in eligibility_entry_ids:
            parts = entry_id.split(':')
            if len(parts) != 3:
                continue

            project_id = int(parts[0])
            entry_type = parts[1]
            entry_value = parts[2]
            project_ids.add(project_id)

            if entry_type == 'work':
                work_id = int(entry_value)
                work_selections.setdefault(project_id, []).append(work_id)
            elif entry_type == 'non_work':
                try:
                    non_work_type = NonWorkItemType[entry_value]
                    non_work_selections.setdefault(project_id, []).append(non_work_type)
                except KeyError:
                    pass

        return project_ids, work_selections, non_work_selections

    @classmethod
    def _assign_admin_roles(cls, account_users, account_project, session):
        """Assign admin roles to account users for an account project."""
        for account_user in account_users:
            user_role = getattr(account_user, "role", None)
            if not user_role or not user_role.active:
                continue
            if user_role.role.role_name in [
                RoleEnum.ACCOUNT_PRIMARY_ADMIN.value,
                RoleEnum.PROJECT_ADMIN.value
            ]:
                AccountUserService.assign_role({
                    "account_user_id": account_user.id,
                    "role_id": user_role.role.id,
                    "account_project_id": account_project.id,
                }, session)

    @classmethod
    def _create_work_associations(cls, account_project, work_selections, legacy_project_ids):
        """Create AccountProjectWork associations."""
        if account_project.project_id in work_selections:
            for work_id in work_selections[account_project.project_id]:
                AccountProjectWork.get_or_create(account_project.id, work_id)
        elif account_project.project_id in legacy_project_ids:
            works = TrackWork.find_by_project_id(account_project.project_id)
            for work in works:
                AccountProjectWork.get_or_create(account_project.id, work.id)

    @classmethod
    def _create_non_work_associations(cls, account_project, non_work_selections):
        """Create AccountProjectNonWork associations."""
        if account_project.project_id in non_work_selections:
            for non_work_type in non_work_selections[account_project.project_id]:
                AccountProjectNonWork.get_or_create(account_project.id, non_work_type)

    @classmethod
    def add_eligible_account_projects(cls, proponent_id, proponent_data):
        """Add eligible projects for proponent id."""
        eligibility_entry_ids = proponent_data.get("eligibility_entry_ids", [])
        legacy_project_ids = proponent_data.get("projects", [])

        proponent = Proponent.find_by_id(proponent_id)
        if not proponent:
            raise ResourceNotFoundError(f"Proponent with id {proponent_id} not found")
        if proponent.status is not ProponentStatus.ONBOARDED:
            raise BadRequestError("Can only enable projects for onboarded proponents.")

        account = Account.get_by_proponent_id(proponent_id)
        account_users = AccountUser.get_users_by_account_id(account.id)

        project_ids, work_selections, non_work_selections = cls._parse_eligibility_entries(
            eligibility_entry_ids
        )
        project_ids.update(legacy_project_ids)

        with session_scope() as session:
            InvitationService.get_or_create_account_projects(
                account.id, list(project_ids), session
            )
            account_projects = AccountProject.get_all_in_project_ids(list(project_ids))

            for account_project in account_projects:
                cls._assign_admin_roles(account_users, account_project, session)
                cls._create_work_associations(account_project, work_selections, legacy_project_ids)
                cls._create_non_work_associations(account_project, non_work_selections)

            session.flush()
