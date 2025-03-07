"""Service for proponent management."""
from submit_api.models import Project


class ProponentService:
    """Project management service."""

    @classmethod
    def get_proponents(cls):
        """Get account project by id."""
        proponents = Project.get_all_proponents()
        return proponents
