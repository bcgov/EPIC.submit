"""Service for account user management."""
from datetime import datetime, UTC

from flask import current_app

from submit_api.enums.role import RoleEnum
from submit_api.exceptions import PermissionDeniedError, ResourceNotFoundError
from submit_api.models import AccountUser as AccountUserModel
from submit_api.models.user_status import UserStatusEnum
from submit_api.models import AccountProject as AccountProjectModel
from submit_api.models import Invitations as InvitationsModel
from submit_api.models import Package as PackageModel
from submit_api.models import Role as RoleModel
from submit_api.models import TermsOfService as TermsOfServiceModel
from submit_api.models import User as UserModel
from submit_api.models import UserRole as UserRoleModel
from submit_api.models.db import db
from submit_api.utils.token_info import TokenInfo


class AccountUserService:
    """Account User management service."""

    @classmethod
    def get_users_by_account_projects(cls, account_id, include_roles=False,
                                      include_invitees=False):
        """Get all users associated with an account, optionally including roles & invitees."""
        account_user = AccountUserModel.get_by_guid(TokenInfo.get_username())
        if not account_user:
            current_app.logger.warning("Unauthorized access attempt to account users.")
            raise PermissionDeniedError("Unauthorized access to account users.")
        account_project_ids = None
        if account_user.roles:
            account_project_ids = [role.account_project_id for role in account_user.roles if role.account_project_id]
        return cls.get_users_by_account(
            account_id,
            include_roles=include_roles,
            include_invitees=include_invitees,
            account_project_ids=account_project_ids
        )

    @classmethod
    def get_users_by_account(cls, account_id, include_roles=False, include_invitees=False, account_project_ids=None):
        """Get all users associated with an account, optionally including roles & invitees."""
        users = cls._fetch_users(account_id, account_project_ids)

        # Collect all unique package IDs and fetch their names
        package_name_map = cls._collect_and_fetch_package_names(users)

        # Process users and build user list
        user_list = [cls._process_user_data(user, package_name_map) for user in users]

        if include_invitees:
            # we are fetching invitees as well since we are not creating users on invitations
            # fetch them since user list shows invitations as well..
            invitees = cls._fetch_invitees(account_id, include_roles, account_project_ids)
            user_list.extend(invitees)

        return user_list

    @classmethod
    def _collect_and_fetch_package_names(cls, users):
        """Collect all unique package IDs from users and fetch their names."""
        all_package_ids = set()
        for user in users:
            # Collect from active roles and all_roles (for revoked users)
            source_roles = user.roles if user.roles else getattr(user, 'all_roles', [])
            for role in source_roles:
                if role.original_package_ids:
                    all_package_ids.update(role.original_package_ids)
        return cls._fetch_package_names(list(all_package_ids))

    @classmethod
    def _process_user_data(cls, user, package_name_map):
        """Process a single user and return user data dict with roles."""
        user_data = user.to_dict()
        user_data["status"] = cls._fetch_user_status_name(user_data.get("user_id"))

        # Map roles - use active roles first, fall back to all_roles for revoked users
        roles_data = []
        source_roles = user.roles if user.roles else getattr(user, 'all_roles', [])
        for role in source_roles:
            role_dict = role.to_dict()
            if role.original_package_ids:
                role_dict["package_names"] = [
                    package_name_map[pkg_id] for pkg_id in role.original_package_ids if pkg_id in package_name_map
                ]
            roles_data.append(role_dict)

        user_data["roles"] = roles_data
        return user_data

    @staticmethod
    def _fetch_package_names(original_package_ids: list[int]) -> dict[int, str]:
        """Fetch package names for given IDs and return as {id: name}."""
        packages = PackageModel.get_all_latest_packages_by_original_package_ids(original_package_ids)
        return {pkg.version.original_package_id: pkg.name for pkg in packages}

    @staticmethod
    def _fetch_users(account_id, account_project_ids=None):
        """Fetch active users from the `account_users` table."""
        return AccountUserModel.get_filtered_by_account_id(account_id, account_project_ids)

    @staticmethod
    def _fetch_user_status_name(user_id):
        """Fetch only the user's status name."""
        return UserModel.get_status_name_by_id(user_id)

    @staticmethod
    def _fetch_roles(users):
        """Fetch roles for the given users and map them to user IDs."""
        # Ensure users is iterable (convert single user to a list if necessary)
        if isinstance(users, list):
            user_ids = [user.id for user in users]
        else:
            user_ids = [users.id]  # For a single user, create a list with the user id

        user_roles = UserRoleModel.get_all_in_user_ids(user_ids)

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
    def _fetch_invitees(account_id, include_roles, account_project_ids=None):
        """Fetch invited users from the `invitations` table"""
        project_ids = None
        if account_project_ids:
            project_ids = AccountProjectModel.get_project_ids_by_ids(account_project_ids)

        invitees = InvitationsModel.get_active_by_account_id(account_id, project_ids)

        invited_users = []
        for invite in invitees:
            packages = []
            if invite.original_package_ids:
                packages = PackageModel.get_all_latest_packages_by_original_package_ids(invite.original_package_ids)
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

        # If user already has roles, try to find one?
        # But this method is usually called when assigning a NEW role without explicit project ID.
        # Fallback to the first project of the account for now, but really this should be explicit.
        account_project = AccountProjectModel.get_by_account_id(account_user.account_id)
        return account_project.id

    @classmethod
    def get_account_user(cls, guid):
        """Fetch an user for a user id."""
        user = AccountUserModel.get_by_guid(guid)
        user_dict = user.to_dict()
        user_dict["status"] = cls._fetch_user_status_name(user_dict.get("user_id"))
        return user_dict

    @classmethod
    def get_account_user_by_id(cls, account_user_id):
        """Fetch a user by account_user id."""
        user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        if not user:
            return None
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
        """Update user's role using replace-all strategy.

        Deletes all existing user_role rows and creates new ones
        for the desired state (role + project assignments).
        """
        new_role_name = updated_role_data.get("role_name")
        account_project_ids = updated_role_data.get("account_project_ids", [])
        original_package_ids = updated_role_data.get("original_package_ids", None)
        package_ids = updated_role_data.get("package_ids", None)

        AccountUserService._validate_user_permission(user_guid, account_user_id, new_role_name)

        role = AccountUserService._validate_fetch_role(new_role_name)

        if not account_project_ids:
            raise ResourceNotFoundError("account_project_ids is required.")

        # Replace-all: delete existing roles and create new ones
        UserRoleModel.delete_all_by_account_user_id(account_user_id)

        # Only set original_package_ids for SPECIFIC_SUBMISSION_CONTRIBUTOR
        effective_package_ids = (
            original_package_ids
            if new_role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value
            else None
        )

        for account_project_id in account_project_ids:
            UserRoleModel.create_user_role({
                "account_user_id": account_user_id,
                "role_id": role.id,
                "account_project_id": account_project_id,
                "package_ids": package_ids,
                "original_package_ids": effective_package_ids,
            })

        db.session.commit()
        db.session.expire_all()

        current_app.logger.info(
            f"User {account_user_id} role updated to {new_role_name} "
            f"for projects {account_project_ids}."
        )

        account_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        user_dict = account_user.to_dict()
        user_dict["status"] = cls._fetch_user_status_name(user_dict.get("user_id"))
        return user_dict

    @staticmethod
    def _validate_user_permission(user_guid: str, account_user_id: int, new_role_name: str = None) -> None:
        """Validate permissions for editing a user's role.

        Rules:
        - Users cannot edit their own role
        - Only ACCOUNT_PRIMARY_ADMIN and PROJECT_ADMIN can edit roles
        - PROJECT_ADMIN cannot edit ACCOUNT_PRIMARY_ADMIN users
        - PROJECT_ADMIN cannot assign ACCOUNT_PRIMARY_ADMIN role
        """
        user = UserModel.get_by_guid(user_guid)

        # Prevent users from updating their own role
        if user.account_user and user.account_user.id == account_user_id:
            current_app.logger.warning("Users cannot update their own role.")
            raise PermissionDeniedError("Users cannot update their own role.")

        # Determine the acting user's highest role
        is_account_admin = False
        is_project_admin = False
        if user.account_user and user.account_user.roles:
            for role in user.account_user.roles:
                if role.role.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
                    is_account_admin = True
                    break
                if role.role.role_name == RoleEnum.PROJECT_ADMIN.value:
                    is_project_admin = True

        if not is_account_admin and not is_project_admin:
            current_app.logger.warning("Only account/project admins are allowed to edit roles.")
            raise PermissionDeniedError("Only account/project admins are allowed to edit roles.")

        # Project Admins have restricted scope
        if is_project_admin and not is_account_admin:
            # Cannot edit Regulated Party Account Administrator users
            target_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
            if target_user and target_user.roles:
                for target_role in target_user.roles:
                    if target_role.role.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
                        raise PermissionDeniedError(
                            "Project Admins cannot edit Regulated Party Account Administrator users."
                        )

            # Cannot assign Regulated Party Account Administrator role
            if new_role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
                raise PermissionDeniedError(
                    "Project Admins cannot assign the Regulated Party Account Administrator role."
                )

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
        # Use all_roles to access both active and inactive roles
        now = datetime.now(UTC)
        for role in account_user.all_roles:
            if active:
                role.active = True
                role.access_end = None
            else:
                role.active = False
                role.access_end = now

        # Update the User status_id accordingly. Access is enforced per-request
        # against this DB status, so we intentionally do NOT enable/disable the
        # user in Keycloak here.
        user = UserModel.find_by_id(account_user.user_id)
        if active:
            user.status_id = UserStatusEnum.ACTIVE.value
        else:
            user.status_id = UserStatusEnum.ACCESS_REVOKED.value

        db.session.commit()
        current_app.logger.info(f"User {account_user_id} {'activated' if active else 'deactivated'} successfully.")
        return cls._build_user_response(account_user_id)

    @classmethod
    def _build_user_response(cls, account_user_id):
        """Refresh user from DB and enrich with role/package data."""
        updated_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        user_dict = updated_user.to_dict()
        user_dict["status"] = cls._fetch_user_status_name(user_dict.get("user_id"))

        roles = user_dict.get("roles", [])

        if not roles:
            user_dict["role"] = []
            user_dict["roles"] = []
        else:
            all_original_package_ids = set()
            for r in roles:
                if r.get("original_package_ids"):
                    all_original_package_ids.update(r.get("original_package_ids"))

            package_name_map = cls._fetch_package_names(list(all_original_package_ids))

            for r in roles:
                ids = r.get("original_package_ids") or []
                r["package_names"] = [package_name_map[pid] for pid in ids if pid in package_name_map]

            # Re assign role for compatibility
            user_dict["role"] = roles[0] if roles else []

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
        account_user.terms_of_service_accepted_date = datetime.now(UTC)
        db.session.commit()

        return AccountUserModel.get_users_by_account_user_id(account_user_id)

    @classmethod
    def get_access_history(cls, account_user_id):
        """Get access history for a user, including project and package details."""
        account_user = AccountUserModel.get_users_by_account_user_id(account_user_id)
        if not account_user:
            return None

        history_roles = UserRoleModel.get_access_history_by_account_user_id(account_user_id)

        # Collect all package IDs for name resolution
        all_package_ids = set()
        for role in history_roles:
            if role.original_package_ids:
                all_package_ids.update(role.original_package_ids)
        package_name_map = cls._fetch_package_names(list(all_package_ids))

        # Collect account_project_ids for project name resolution
        account_project_ids = {r.account_project_id for r in history_roles if r.account_project_id}
        account_projects = AccountProjectModel.get_all_in_ids(list(account_project_ids))
        project_map = {ap.id: ap.project.name for ap in account_projects}

        history = []
        for role in history_roles:
            entry = {
                "id": role.id,
                "account_project_id": role.account_project_id,
                "project_name": project_map.get(role.account_project_id, "Unknown"),
                "role_name": role.role.role_name,
                "role_label": role.role.role_name,
                "active": role.active,
                "access_start": role.access_start.isoformat() if role.access_start else None,
                "access_end": role.access_end.isoformat() if role.access_end else None,
                "original_package_ids": role.original_package_ids,
                "package_names": [
                    package_name_map[pid]
                    for pid in (role.original_package_ids or [])
                    if pid in package_name_map
                ],
            }
            history.append(entry)

        return history
