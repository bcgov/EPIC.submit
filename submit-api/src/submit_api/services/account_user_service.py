"""Service for account user management."""
from submit_api.models import AccountUser as AccountUserModel


class AccountUserService:
    """Account User management service."""

    @classmethod
    def get_users_by_account(cls, account_id):
        """Get all users associated with an account."""
        users = AccountUserModel.get_users_by_account_id(account_id)
        return users
