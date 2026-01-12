"""Service for proponent management."""
from submit_api.models.proponent import Proponent
from submit_api.models.project import Project


class ProponentService:
    """Proponent management service."""

    @classmethod
    def get_proponent(cls, proponent_id, include_invitations=False, include_projects=False):
        """Get proponent by id."""
        return Project.get_proponent_by_id(
            proponent_id,
            include_invitations=include_invitations,
            include_projects=include_projects
        )

    @classmethod
    def get_all_proponents(cls, include_deleted=False, approved_conditions_only=False):
        """Get all proponents from the Proponent table.

        Args:
            include_deleted: If True, includes deleted proponents. Defaults to False.
            approved_conditions_only: If True, returns only proponents that have projects 
                                     with approved conditions. Defaults to False.

        Returns:
            List of Proponent objects.
        """
        return Proponent.get_all_proponents(
            include_deleted=include_deleted,
            approved_conditions_only=approved_conditions_only
        )
