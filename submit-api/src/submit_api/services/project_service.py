"""Service for project management."""

from submit_api.exceptions import PermissionDeniedError, BadRequestError
from submit_api.models import User as UserModel
from submit_api.models.account_project import AccountProject as AccountProjectModel
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.project import Project as ProjectModel
from submit_api.models.queries.account_project import ProjectQueries
from submit_api.models.user import UserType
from submit_api.services import authorization
from submit_api.utils.token_info import TokenInfo


class ProjectService:
    """Project management service."""

    @classmethod
    def get_account_project_by_id(cls, account_project_id, is_staff: bool):
        """Get account project by id."""
        authorization.check_has_permissions_on_project(
            account_project_ids=[account_project_id],
        )
        return ProjectQueries.get_account_project_by_id(account_project_id, is_staff)

    @classmethod
    def get_projects_by_account_id(cls, account_id, search_options: AccountProjectSearchOptions = None,
                                   is_proponent=True):
        """Get projects by account id."""
        guid = TokenInfo.get_username()
        user = UserModel.get_by_guid(guid)

        if not user:
            raise PermissionDeniedError("User not found")

        if user.type != UserType.PROPONENT:
            raise BadRequestError("User is not a certificate holder")

        if user.account_user.account_id != account_id:
            raise PermissionDeniedError("User does not belong to this account")

        projects, _ = ProjectQueries.get_filtered_account_projects_paginated(
            search_options, None, None, is_proponent, user
        )
        return projects

    @classmethod
    def get_account_projects_by_user_id(cls, user_id):
        """Get projects by account user id."""
        user = UserModel.find_by_id(user_id)
        if not user.account_user:
            return []
        account_user = user.account_user
        projects = cls.get_projects_by_account_id(
            account_user.account_id, search_options=None, is_proponent=True)
        return projects

    @classmethod
    def get_projects_by_proponent_id(cls, proponent_id):
        """Get projects by proponent id."""
        return ProjectQueries.get_projects_by_proponent_id(proponent_id)

    @classmethod
    def bulk_add_projects(cls, account_id: int, project_ids: list):
        """Add projects in bulk."""
        projects = ProjectModel.get_all_projects_in_ids(project_ids)
        projects_to_add = [
            {"account_id": account_id, "project_id": project.id} for project in projects
        ]
        # Note: bulk add bypasses access control, assumed to be staff-only operation
        AccountProjectModel.add_projects_bulk(projects_to_add)
        return projects

    @classmethod
    def get_all_account_projects_paginated(cls, search_options: AccountProjectSearchOptions,
                                           page: int = 1, page_size: int = 10, is_proponent: bool = True):
        """Get projects with pagination."""
        return ProjectQueries.get_filtered_account_projects_paginated(
            search_options, page, page_size, is_proponent)
