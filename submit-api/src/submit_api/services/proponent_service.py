"""Service for proponent management."""
from submit_api.models import Project


class ProponentService:
    """Project management service."""

    @classmethod
    def get_proponents(cls):
        """Get account project by id."""
        proponents = Project.get_all_proponents()
        return proponents

    @classmethod
    def get_proponent(cls, proponent_id, include_invitations=False, include_projects=False):
        """Get account project by id."""
        proponent = Project.get_proponent_by_id(proponent_id, include_invitations, include_projects)
        return proponent
