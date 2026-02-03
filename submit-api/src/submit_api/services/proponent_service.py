"""Service for proponent management."""
from submit_api.models.proponent import Proponent


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
