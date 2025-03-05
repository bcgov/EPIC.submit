"""Service for account management."""
from submit_api.exceptions import ResourceExistsError, ResourceNotFoundError
from submit_api.models import AccountUser as AccountUserModel
from submit_api.models import Role as RoleModel
from submit_api.models import UserRole as UserRoleModel
from submit_api.models.account import Account as AccountModel
from submit_api.models.db import session_scope
from submit_api.models.queries.package import PackageQueries
from submit_api.models.user import User as UserModel
from submit_api.models.user import UserType


class AccountService:
    """Account management service."""

    @classmethod
    def get_account_by_id(cls, _account_id):
        """Get account by id."""
        db_account = AccountModel.find_by_id(_account_id)
        return db_account

    @classmethod
    def get_account_by_proponent_id(cls, _proponent_id):
        """Get account by id."""
        db_account = AccountModel.get_by_proponent_id(_proponent_id)
        return db_account

    @classmethod
    def get_all_accounts(cls):
        """Get all accounts."""
        accounts = AccountModel.get_all()
        return accounts

    @classmethod
    def validate_create_account_data(cls, data):
        """Validate create account data."""
        proponent_id = data.get("proponent_id")
        if AccountModel.get_by_proponent_id(proponent_id):
            raise ResourceExistsError(f'Account with proponent id {proponent_id} already exists.')

    @classmethod
    def _create_account_user(cls, data, account, session):
        """Create account user."""
        user_data = {
            'auth_guid': data.get('auth_guid'),
            'type': UserType.PROPONENT.value
        }
        user = UserModel.create_user(user_data, session)
        account_user_data = {
            "account_id": account.id,
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "position": data.get("position"),
            "work_email_address": data.get("work_email_address"),
            "work_contact_number": data.get("work_contact_number"),
            "user_id": user.id
        }
        account_user = AccountUserModel.create_account_user(account_user_data, session)
        return account_user

    @classmethod
    def create_account(cls, data):
        """Create account."""
        cls.validate_create_account_data(data)
        with session_scope() as session:
            account_data = {
                'proponent_id': data.get("proponent_id"),
            }
            account = AccountModel.create_account(account_data, session)
            account_user = cls._create_account_user(data, account, session)

            account_admin_role = RoleModel.get_by_name(RoleModel.ACCOUNT_PRIMARY_ADMIN.value)
            if not account_admin_role:
                raise ResourceNotFoundError("Account admin role not found")

            account_role_data = {
                "account_user_id": account_user.id,
                "role_id": account_admin_role.id,
            }
            UserRoleModel.create_user_role(account_role_data, session)

        return account

    @classmethod
    def update_account(cls, account_id, account_data):
        """Update account."""
        updated_account = AccountModel.update_account(account_id, account_data)
        return updated_account

    @classmethod
    def delete_account(cls, account_id):
        """Update account."""
        account = AccountModel.find_by_id(account_id)
        if not account:
            return None

        account.delete()
        return account

    @classmethod
    def get_all_account_packages(cls, account_id):
        """Get packages by account id."""
        return PackageQueries.get_account_project_packages(account_id)
