"""Service for account user management."""
from flask import current_app
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import AccountUser as AccountUserModel
from submit_api.models import Invitations as InvitationsModel
from submit_api.models import Role as RoleModel
from submit_api.models import UserRole as UserRoleModel
from submit_api.models.db import db
from submit_api.models.invitations import InvitationStatus
from submit_api.models.role import RoleEnum


class AccountUserService:
    """Account User management service."""

    @classmethod
    def get_users_by_account(cls, account_id, include_roles=False, include_invitees=False):
        """Get all users associated with an account, optionally including roles & invitees."""
        users = cls._fetch_users(account_id)
        roles_map = cls._fetch_roles(users) if include_roles else {}

        user_list = []
        for user in users:
            user_data = user.to_dict()
            user_data["roles"] = roles_map.get(user.id, []) if include_roles else []
            user_data["status"] = "ACTIVE"
            user_list.append(user_data)

        if include_invitees:
            # we are fetching invitees as well since we are not creating users on invitations
            # fetch them since user list shows invitations as well..
            invitees = cls._fetch_invitees(account_id, include_roles)
            user_list.extend(invitees)

        return user_list

    @staticmethod
    def _fetch_users(account_id):
        """Fetch active users from the `account_users` table."""
        return AccountUserModel.query.filter(AccountUserModel.account_id == account_id).all()

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
                "package_ids": role.package_ids
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
            invited_user = {
                "id": None,
                "account_id": invite.account_id,
                "full_name": invite.email,
                "work_email_address": invite.email,
                "user_id": None,
                "roles": [{
                    "role_id": invite.role_id,
                    "role_name": RoleModel.find_by_id(invite.role_id).role_name,
                    "account_project_id": None,
                    "package_ids": invite.package_ids,
                    "project_ids": invite.project_ids
                }] if include_roles else [],
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

        role = RoleModel.find_by_id(role_id)
        if not role:
            raise ValueError(f"Invalid role ID: {role_id}")
        # dont need account project id for ACCOUNT_PRIMARY_ADMIN
        account_project_id = None if role.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value else account_project_id
        # only for SPECIFIC_SUBMISSION_CONTRIBUTOR , save package id
        package_ids = package_ids if role.role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value else None
        role_data = {
            "account_user_id": account_user_id,
            "role_id": role_id,
            "account_project_id": account_project_id,
            "package_ids": package_ids
        }

        UserRoleModel.create_user_role(role_data, session)
        return {
            "role_id": role.id,
            "role_name": role.role_name,
            "account_project_id": role_data.get("account_project_id"),
            "package_ids": role_data.get("package_ids")
        }

    @classmethod
    def get_account_user(cls, guid):
        """Fetch an user for a user id."""
        user = AccountUserModel.get_by_guid(guid)
        roles_map = cls._fetch_roles(user)
        user_dict = user.to_dict()
        user_dict['roles'] = roles_map.get(user.id, [])
        user_dict["status"] = "ACTIVE"
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
