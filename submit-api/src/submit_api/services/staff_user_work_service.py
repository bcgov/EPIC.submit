"""Service for staff user work management."""
from flask import current_app

from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import StaffUserWork, TrackWork, StaffUser
from submit_api.services.keycloak import KeycloakService
from submit_api.services.staff_user_service import StaffUserService
from submit_api.utils.constants import STAFF_WORK_ROLE_KEYCLOAK_GROUPS


class StaffUserWorkService:
    """Staff user work management service."""

    @classmethod
    def create_or_update_staff_user_work(cls, email: str, work_id: int, role: str):
        """Create or update staff user work assignment from EPIC.track.

        Args:
            email: Email address of the staff user
            work_id: Work ID from EPIC.track
            role: Work role (TEAM_LEAD or TEAM_MEMBER)

        Returns:
            StaffUserWork: The created or updated work assignment

        Raises:
            ResourceNotFoundError: If user not found in Keycloak or work doesn't exist
            BadRequestError: If invalid input
        """
        try:
            staff_user, username = StaffUserService.get_or_create_staff_user_from_email(email)
        except ValueError as e:
            raise BadRequestError(str(e)) from e
        except Exception as e:  # noqa: B902
            current_app.logger.error(f"Failed to fetch user from Keycloak: {str(e)}")
            raise ResourceNotFoundError(f"User with email '{email}' not found in Keycloak.") from e

        # Assign Keycloak group based on role (subgroup under SUBMIT)
        # TEAM_LEAD -> SUBMIT/OPS_TEAM_LEAD, TEAM_MEMBER -> SUBMIT/OPS_TEAM_MEMBER
        # Assign group only if not already assigned (idempotent)
        keycloak_group = STAFF_WORK_ROLE_KEYCLOAK_GROUPS.get(role)
        if not keycloak_group:
            raise BadRequestError(f"Invalid role '{role}'. Must be TEAM_LEAD or TEAM_MEMBER.")

        try:
            user_groups = KeycloakService.get_user_groups(username)
            has_role_group = any(group.get('path') == f'/{keycloak_group}'
                                 for group in user_groups)
            if not has_role_group:
                group_id = KeycloakService.get_group_id_by_path(keycloak_group)
                KeycloakService.update_user_group(user_id=username, group_id=group_id)
                current_app.logger.info(f"Assigned {keycloak_group} group to user {username}")
            else:
                current_app.logger.info(f"User {username} already has {keycloak_group} group")
        except Exception as e:  # noqa: B902  # pylint: disable=broad-exception-caught
            current_app.logger.error(f"Failed to assign {keycloak_group} group to user {username}: {str(e)}")
            raise ResourceNotFoundError(
                f"Failed to assign required Keycloak group '{keycloak_group}' to user. "
                "Please ensure Keycloak is accessible and try again."
            ) from e

        # Validate work_id exists in track_works
        work = TrackWork.find_by_id(work_id)
        if not work:
            raise ResourceNotFoundError(f"Work with ID {work_id} not found.")

        # Get or create StaffUserWork record and set is_active=True
        staff_user_work = StaffUserWork.get_or_create(
            staff_user_id=staff_user.id,
            work_id=work_id
        )

        current_app.logger.info(
            f"Created/updated work assignment: staff_user_id={staff_user.id}, "
            f"work_id={work_id}, role={role} (Keycloak group assignment only)"
        )

        return staff_user_work

    @classmethod
    def remove_staff_user_work_by_work_id(cls, work_id: int):
        """Remove all staff user work assignments for a given work ID.

        Args:
            work_id: Work ID from EPIC.track

        Raises:
            ResourceNotFoundError: If no active assignments found for the work ID
        """
        assignments = StaffUserWork.find_by_work_id(work_id)
        if not assignments:
            raise ResourceNotFoundError(
                f"No active work assignments found for work ID {work_id}."
            )

        for assignment in assignments:
            # Remove OPS Keycloak groups for each affected user
            username = assignment.staff_user.user.auth_guid
            cls._remove_keycloak_ops_groups(username)

            assignment.is_active = False
            assignment.persist()

            current_app.logger.info(
                f"Removed work assignment: staff_user_id={assignment.staff_user_id}, "
                f"work_id={work_id}"
            )

    @classmethod
    def remove_staff_user_works_by_auth_guid(cls, auth_guid: str):
        """Remove all staff user work assignments for a user by their auth_guid.

        Deactivates all work assignments and removes OPS_TEAM_MEMBER/OPS_TEAM_LEAD
        Keycloak groups from the user.

        Args:
            auth_guid: The user's authentication GUID

        Raises:
            ResourceNotFoundError: If staff user not found for the given auth_guid
        """
        staff_user = StaffUser.get_by_guid(auth_guid)
        if not staff_user:
            raise ResourceNotFoundError(
                f"Staff user not found for auth_guid '{auth_guid}'."
            )

        # Remove OPS Keycloak groups
        cls._remove_keycloak_ops_groups(auth_guid)

        # Deactivate all active work assignments
        active_assignments = StaffUserWork.find_by_staff_user_id(staff_user.id)
        for assignment in active_assignments:
            assignment.is_active = False
            assignment.persist()

        current_app.logger.info(
            f"Removed all work assignments for staff_user_id={staff_user.id} "
            f"(auth_guid={auth_guid}), {len(active_assignments)} assignment(s) deactivated."
        )

    @classmethod
    def _remove_keycloak_ops_groups(cls, username: str):
        """Remove OPS Keycloak groups from a user.

        Args:
            username: The user's auth_guid used as Keycloak username
        """
        try:
            user_groups = KeycloakService.get_user_groups(username)
            for _role, group_path in STAFF_WORK_ROLE_KEYCLOAK_GROUPS.items():
                has_group = any(
                    group.get('path') == f'/{group_path}' for group in user_groups
                )
                if has_group:
                    group_id = KeycloakService.get_group_id_by_path(group_path)
                    KeycloakService.delete_user_group(
                        user_id=username, group_id=group_id
                    )
                    current_app.logger.info(
                        f"Removed {group_path} group from user {username}"
                    )
        except Exception as e:  # noqa: B902  # pylint: disable=broad-exception-caught
            current_app.logger.warning(
                f"Failed to remove OPS groups from user {username}: {str(e)}"
            )

    @classmethod
    def get_works_for_staff_user(cls, staff_user_id: int):
        """Get all active work assignments for a staff user.

        Args:
            staff_user_id: ID of the staff user

        Returns:
            list[StaffUserWork]: List of active work assignments
        """
        return StaffUserWork.find_by_staff_user_id(staff_user_id)

    @classmethod
    def get_all_staff_work_roles(cls):
        """Get all active staff work role assignments.

        Returns:
            list[StaffUserWork]: List of all active staff work assignments with staff user and work details
        """
        return StaffUserWork.query.filter_by(is_active=True).all()
