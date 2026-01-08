"""Service for proponent management."""
from submit_api.models.proponent import Proponent
from submit_api.models.project import Project


class ProponentService:
    """Proponent management service."""

    @classmethod
    def get_proponent(cls, proponent_id, include_invitations=False, include_projects=False):
        """Get proponent by id.
        
        Maintains backward compatibility by using Project.get_proponent_by_id()
        for existing pages like invitations. This ensures the invitations page
        continues to work as before.
        """
        return Project.get_proponent_by_id(
            proponent_id,
            include_invitations=include_invitations,
            include_projects=include_projects
        )

    @classmethod
    def get_proponents_from_projects(cls):
        """Get all proponents from Project model.
        
        Maintains backward compatibility for invitations page.
        This was previously used by invitations.
        Returns list of dictionaries with 'id' and 'name' keys.
        """
        proponents = Project.get_all_proponents()
        return [
            {
                "id": proponent_id,
                "proponent_id": proponent_id,
                "name": proponent_name,
                "status": None,
                "is_deleted": False
            }
            for proponent_id, proponent_name in proponents
        ]

    @classmethod
    def get_all_proponents(cls, include_deleted=False):
        """Get all proponents from the new Proponent table.
        
        Uses the new Proponent model for the new proponent management pages.
        """
        return Proponent.get_all_proponents(include_deleted=include_deleted)