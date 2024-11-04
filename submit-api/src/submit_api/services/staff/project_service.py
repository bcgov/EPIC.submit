"""Service for project management."""
from submit_api.models import AccountProject as AccountProjectModel


class ProjectService:
    """Project management service for staff."""

    @classmethod
    def get_all_account_projects(cls):
        """Get projects by proponent id."""
        return AccountProjectModel.get_all()
