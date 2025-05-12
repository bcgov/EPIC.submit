"""Service for account management."""
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import User
from submit_api.models.account_terms_of_service import TermsOfService


class UserService:
    """Account management service."""

    @classmethod
    def get_by_auth_guid(cls, _guid):
        """Get account by auth guid."""
        user = User.get_by_guid(_guid)
        if not user:
            raise ResourceNotFoundError(f"User with auth guid {_guid} not found")

        account_user = user.account_user
        if account_user:
            if account_user.agreed_terms_of_service_id:
                active_terms = TermsOfService.get_active_terms_of_service_by_id(
                    account_user.agreed_terms_of_service_id)
                user.account_user.agreed_terms = bool(active_terms)
            else:
                user.account_user.agreed_terms = False

        return user

    @classmethod
    def create_user(cls, data, session=None):
        """Create a new user."""
        return User.create_user(data, session)
