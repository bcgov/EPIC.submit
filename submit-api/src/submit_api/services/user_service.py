"""Service for account management."""
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models.queries.account_user import UserQueries


class UserService:
    """Account management service."""

    @classmethod
    def get_by_auth_guid(cls, _guid):
        """Get account by auth guid."""
        user = UserQueries.get_by_guid(_guid)
        if not user:
            raise ResourceNotFoundError(f"User with auth guid {_guid} not found")
        return user
