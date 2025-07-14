"""Service for account user management."""
from datetime import datetime
from flask import current_app

from submit_api.enums.role import RoleEnum
from submit_api.exceptions import PermissionDeniedError, ResourceNotFoundError
from submit_api.models import AccountUser as AccountUserModel
from submit_api.models import AccountProject as AccountProjectModel
from submit_api.models import Invitations as InvitationsModel
from submit_api.models import Package as PackageModel
from submit_api.models import Role as RoleModel
from submit_api.models import TermsOfService as TermsOfServiceModel
from submit_api.models import User as UserModel
from submit_api.models import UserRole as UserRoleModel
from submit_api.models.user_status import UserStatusEnum
from submit_api.models.db import db
from submit_api.models.invitations import InvitationStatus
from submit_api.services.keycloak import KeycloakService


class AccountUserService:
    """Account User management service."""

    @classmethod
    def get_users_by_account(cls, account_id, include_roles=False, include_invitees=False):
        """Get all users associated with an account, optionally including roles & invitees."""
        users = cls._fetch_users(account_id)
        # roles_map = cls._fetch_roles(users) if include_roles else {}

        # Collect all unique package IDs first
        all_package_ids = set()
        for user in users:
            role = getattr(user, "role", None)
            if role and role.original_package_ids:
                all_package_ids.update(role.original_package_ids)

        # Fetch names for all package_ids at once
        package_name_map = cls._fetch_package_names(list(all_package_ids))

        user_list = []
        for user in users:
            user_data = user.to_dict()
            user_data["status"] = cls._fetch_user_status_name(user_data.get("user_id"))
            # Add package_name to active role if applicable
            role = user_data.get("role")
            user_data["role"] = role if role.get("active") else []
            if role and role.get("active") and (pkg_ids := role.get("original_package_ids")):
                role["package_names"] = [
                    package_name_map[pkg_id] for pkg_id in pkg_ids if pkg_id in package_name_map]

            user_list.append(user_data)

        if include_invitees:
            # we are fetching invitees as well since we are not creating users on invitations
            # fetch them since user list shows invitations as well..
            invitees = cls._fetch_invitees(account_id, include_roles)
            user_list.extend(invitees)

        return user_list

    @staticmethod
    def _fetch_package_names(original_package_ids: list[int]) -> dict[int, str]:
        """Fetch package names for given IDs and return as {id: name}."""
        packages = PackageModel.get_all_active_packages_by_original_package_ids(original_package_ids)
        return {pkg.id: pkg.name for pkg in packages}

    @staticmethod
    def _fetch_users(account_id):
        """Fetch active users from the `account_users` table."""
        return AccountUserModel.query.filter(AccountUserModel.account_id == account_id).all()

    @staticmethod
    def _fetch_user_status_name(user_id):
        """Fetch only the user's status name."""
        user = UserModel.query.filter(UserModel.id == user_id).first()
        return user.user_status.status_name if user else None

    @staticmethod
    def _fetch_roles(users):
        """Fetch roles for the given users and map them to user IDs."""
        # Ensure users is iterable (convert single user to a list if necessary)
        if isinstance(users, list):
            user_ids = [user.id for user in users]
        else:
            user_ids = [users.id]  # For a single user, create a list with the user id

        user_roles = (
            UserRoleModel.query
            .filter(UserRoleModel.account_user_id.in_(user_ids))
            .all()
        )

        roles_map = {}
        for role in user_roles:
            if role.account_user_id not in roles_map:
                roles_map[role.account_user_id] = []
            roles_map[role.account_user_id].append({
                "role_id": role.role_id,
                "role_name": RoleModel.find_by_id(role.role_id).role_name,
                "account_project_id": role.account_project_id,
                "package_ids": role.package_ids,
                "original_package_ids": role.original_package_ids,
            })
        return roles_map

    @staticmethod
    def _fetch_invitees(account_id, include_roles):
        """Fetch invited users from the `invitations` table"""
        invitees = InvitationsModel.query.filter(
            InvitationsModel.account_id == account_id,
            InvitationsModel.status.in_([InvitationStatus.PENDING.value, InvitationStatus.REVOKED.value])
        ).all()

        invited_users = []
        for invite in invitees:
            packages = []
            if invite.original_package_ids:
                packages = PackageModel.get_all_active_packages_by_original_package_ids(invite.original_package_ids)

            invited_user = {
                "id": None,
                "invitation_id": invite.id,
                "account_id": invite.account_id,
                "full_name": invite.email,
                "work_email_address": invite.email,
                "user_id": None,
                "role": {
                    "role_id": invite.role_id,
                    "role": invite.role.to_dict(),
                    "account_project_id": None,
                    "package_ids": invite.package_ids,
                    "original_package_ids": invite.original_package_ids,
                    "package_names": [pkg.name for pkg in packages],
                    "project_ids": invite.project_ids
                } if include_roles else None,
                "status": invite.status
            }
            invited_users.append(invited_user)

        return invited_users

    @classmethod
    def create_account_user(cls, data, session=None):
        """Create a new AccountUser."""
        return AccountUserModel.create_account_user(data, session)

    @classmethod
    def assign_role(cls, role_data, session=None):
        """Assign a role to the user."""
        account_user_id = role_data.get("account_user_id")
        role_id = role_data.get("role_id")
        account_project_id = role_data.get("account_project_id")
        package_ids = role_data.get("package_ids")
        original_package_ids = role_data.get("original_package_ids")

        role = RoleModel.find_by_id(role_id)
        if not role:
            raise ValueError(f"Invalid role ID: {role_id}")

        # ideally UI should be passing this. fetch it if UI doesnt send it..
        if not account_project_id:
            account_project_id = cls._fetch_account_project_id(account_user_id)

        # only for SPECIFIC_SUBMISSION_CONTRIBUTOR , save package id
        original_package_ids = original_package_ids \
            if role.role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value else None
        role_data = {
            "account_user_id": account_user_id,
            "role_id": role_id,
            "account_project_id": account_project_id,
            "package_ids": package_ids,
            "original_package_ids": original_package_ids,
            "role_name": role.role_name
        }

        UserRoleModel.create_user_role(role_data, session)
        return {
            "role_id": role.id,
            "role_name": role.role_name,
            "account_project_id": role_data.get("account_project_id"),
            "package_ids": role_data.get("package_ids"),
            "original_package_ids": role_data.get("original_package_ids")
        }

    @classmethod
    def _fetch_account_project_id(cls, account_user_id):
        # works under the assumption one user has only one project, account
        account_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        if not account_user:
            raise ValueError(f"Invalid account user ID: {account_user_id}")
        account_project = AccountProjectModel.get_by_account_id(account_user.account_id)
        return account_project.id

    @classmethod
    def get_account_user(cls, guid):
        """Fetch an user for a user id."""
        user = AccountUserModel.get_by_guid(guid)
        user_dict = user.to_dict()
        user_dict["status"] = cls._fetch_user_status_name(user_dict.get("user_id"))
        return user_dict

    @staticmethod
    def _apply_update_data(account_user, update_data):
        """Apply update data to the account user."""
        for key, value in update_data.items():
            setattr(account_user, key, value)
        current_app.logger.debug(f"Updated submission item {account_user.id} with data: {update_data}")

    @classmethod
    def update_account_user(cls, guid, update_data):
        """Update submission item by id."""
        account_user = AccountUserModel.get_by_guid(guid)
        if not account_user:
            current_app.logger.warning(f"Account user with id {guid} not found.")
            raise ResourceNotFoundError(f"Item with id {guid} not found.")

        cls._apply_update_data(account_user, update_data)
        db.session.add(account_user)
        db.session.flush()
        db.session.commit()

        current_app.logger.info(f"Account user {account_user.id} updated successfully.")
        return account_user

    @classmethod
    def update_role(cls, user_guid, account_user_id, updated_role_data):
        """Update user's role."""
        AccountUserService._validate_user_permission(user_guid, account_user_id)

        user_role = UserRoleModel.get_role_by_account_user_id(account_user_id)
        if not user_role:
            current_app.logger.warning(f"User role with id {account_user_id} not found.")
            raise ResourceNotFoundError(f"Item with id {account_user_id} not found.")

        new_role_name = updated_role_data.get("role_name")
        package_ids = updated_role_data.get("package_ids", None)
        original_package_ids = updated_role_data.get("original_package_ids", None)
        role = AccountUserService._validate_fetch_role(new_role_name)

        user_role.role_id = role.id
        user_role.package_ids = package_ids
        user_role.original_package_ids = original_package_ids
        db.session.commit()

        current_app.logger.info(f"User role {user_role.id} updated successfully.")

        account_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        user_dict = account_user.to_dict()
        user_dict["status"] = cls._fetch_user_status_name(user_dict.get("user_id"))
        return user_dict

    @staticmethod
    def _validate_user_permission(user_guid: str, account_user_id: int) -> None:
        """Ensure a user is not updating their own role and restrict PROJECT_ADMIN from editing roles."""
        # TODO: Move this to common authorization
        user = UserModel.get_by_guid(user_guid)
        user_role = user.account_user.role
        role_name = user_role.role.role_name

        if not user or not user.account_user:
            current_app.logger.warning("Only account admins are allowed to edit roles.")
            raise PermissionDeniedError("Only account admins are allowed to edit roles.")

        if user.account_user.id == account_user_id:
            current_app.logger.warning(f"User {user.id} attempted to update their own role.")
            raise PermissionDeniedError("You are not allowed to update your own role.")

        if role_name != RoleEnum.PROJECT_ADMIN.value:
            current_app.logger.warning("Only account admins are allowed to edit roles.")
            raise PermissionDeniedError("Only account admins are allowed to edit roles.")

    @staticmethod
    def _validate_fetch_role(role_name):
        """Validate if the given role ID exists, otherwise throw an exception."""
        role = RoleModel.get_by_name(role_name)
        if not role:
            raise ResourceNotFoundError(f"Invalid role name: {role_name}")
        return role

    @classmethod
    def reactivate_deactivate_user(cls, user_guid, account_user_id, active: bool):
        """Enable or disable a user account."""
        AccountUserService._validate_user_permission(user_guid, account_user_id)

        # Update user and role status
        account_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        account_user.user.status_id = (
            UserStatusEnum.ACTIVE.value if active else UserStatusEnum.INACTIVE.value
        )
        account_user.role.active = active
        db.session.commit()

        # Update Keycloak login access
        KeycloakService.toggle_user_enabled_status(
            user_id=account_user.user.auth_guid, enabled=active
        )

        # Refresh and prepare user data
        updated_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        user_dict = updated_user.to_dict()
        user_dict["status"] = cls._fetch_user_status_name(user_dict.get("user_id"))

        role = user_dict.get("role")
        if not role.get("active"):
            user_dict["role"] = []
        else:
            original_package_ids = role.get("original_package_ids", [])
            package_name_map = cls._fetch_package_names(original_package_ids)
            role["package_names"] = [package_name_map[pid] for pid in original_package_ids if pid in package_name_map]

        return user_dict

    @classmethod
    def record_user_terms_of_service(cls, account_user_id, update_data):
        """Record user's terms of service."""
        if not update_data.get('has_agreed_to_terms'):
            raise ValueError("User must agree to the terms of service.")

        terms_of_service_version_id = update_data.get('terms_of_service_version_id')
        if not terms_of_service_version_id:
            raise ValueError("'terms_of_service_version_id' is required.")

        account_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        if not account_user:
            raise ResourceNotFoundError(f"Account user with ID {account_user_id} not found.")

        terms_of_service = TermsOfServiceModel.get_active_terms_of_service_by_version(
            terms_of_service_version_id)
        if not terms_of_service:
            raise ResourceNotFoundError(f"Terms of service with ID {terms_of_service_version_id} not found")

        account_user.terms_of_service_version_id = terms_of_service_version_id
        account_user.terms_of_service_accepted_date = datetime.utcnow()
        db.session.commit()

        return AccountUserModel.get_users_by_account_user_id(account_user_id)
