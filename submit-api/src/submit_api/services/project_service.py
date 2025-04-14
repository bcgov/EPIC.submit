"""Service for project management."""

from submit_api.models import User as UserModel
from submit_api.models.account_project import AccountProject as AccountProjectModel
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.project import Project as ProjectModel
from submit_api.models.queries.account_project import ProjectQueries


class ProjectService:
    """Project management service."""

    @classmethod
    def get_account_project_by_id(cls, account_project_id):
        """Get account project by id."""
        return ProjectQueries.get_account_project_by_id(account_project_id)

    @classmethod
    def get_projects_by_account_id(cls, account_id, search_options: AccountProjectSearchOptions = None):
        """Get projects by account id."""
        projects, _ = ProjectQueries.get_filtered_account_projects_paginated(account_id, search_options)
        return projects

    @classmethod
    def get_account_projects_by_user_id(cls, user_id):
        """Get projects by account user id."""
        user = UserModel.find_by_id(user_id)
        if not user.account_user:
            return []
        account_user = user.account_user
        projects = cls.get_projects_by_account_id(account_user.account_id, search_options=None)
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
        AccountProjectModel.add_projects_bulk(projects_to_add)
        return projects

    @classmethod
    def get_all_account_projects_paginated(cls, search_options: AccountProjectSearchOptions, page: int = 1, page_size: int = 10):
        """Get projects by proponent id."""
        return ProjectQueries.get_filtered_account_projects_paginated(None, search_options, page, page_size)

    @classmethod
    def get_all_account_projects_with_latest_packages(cls):
        """Get all account projects with latest packages."""
        return AccountProjectModel.get_all_with_latest_packages()
