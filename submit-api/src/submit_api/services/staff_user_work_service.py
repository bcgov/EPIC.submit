"""Service for staff user work management."""
from flask import current_app

from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import StaffUser, StaffUserWork, TrackWork, User
from submit_api.models.user import UserType
from submit_api.services.keycloak import KeycloakService


class StaffUserWorkService:
    """Staff user work management service."""

    @classmethod
    def create_or_update_staff_user_work(cls, email: str, work_id: int, role: str):  # pylint: disable=too-many-locals
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
        # 1. Lookup user in Keycloak by email
        try:
            keycloak_user = KeycloakService.get_user_by_email(email)
        except Exception as e:  # noqa: B902
            current_app.logger.error(f"Failed to fetch user from Keycloak: {str(e)}")
            raise ResourceNotFoundError(f"User with email '{email}' not found in Keycloak.") from e

        username = keycloak_user.get("username")
        first_name = keycloak_user.get("firstName") or ""
        last_name = keycloak_user.get("lastName") or ""
        work_email = keycloak_user.get("email")

        if not username:
            raise BadRequestError(f"Keycloak user with email '{email}' does not have a valid username.")

        # 2. Get or create User record (type=STAFF)
        user = User.get_by_guid(username)
        if not user:
            user_data = {
                "auth_guid": username,
                "type": UserType.STAFF
            }
            user = User.create_user(user_data)
            current_app.logger.info(f"Created User with username {username}")

        # 3. Get or create StaffUser record
        staff_user = user.staff_user
        if not staff_user:
            staff_user_data = {
                "first_name": first_name,
                "last_name": last_name,
                "work_email_address": work_email,
                "user_id": user.id
            }
            staff_user = StaffUser.create_staff_user(staff_user_data)
            current_app.logger.info(f"Created StaffUser for User with username {username}")

        # 4. Check if user has EAO_TEAM_MEMBER Keycloak group (subgroup under SUBMIT)
        # 5. Assign EAO_TEAM_MEMBER group only if not already assigned (idempotent)
        try:
            user_groups = KeycloakService.get_user_groups(username)
            has_eao_team_member = any(group.get('path') == '/SUBMIT/EAO_TEAM_MEMBER'
                                      for group in user_groups)
            if not has_eao_team_member:
                group_id = KeycloakService.get_group_id_by_path('SUBMIT/EAO_TEAM_MEMBER')
                KeycloakService.update_user_group(user_id=username, group_id=group_id)
                current_app.logger.info(f"Assigned SUBMIT/EAO_TEAM_MEMBER group to user {username}")
            else:
                current_app.logger.info(f"User {username} already has SUBMIT/EAO_TEAM_MEMBER group")
        except Exception as e:  # noqa: B902  # pylint: disable=broad-exception-caught
            current_app.logger.warning(f"Failed to assign SUBMIT/EAO_TEAM_MEMBER group: {str(e)}")
            # Don't fail the entire operation if group assignment fails

        # 6. Validate work_id exists in track_works
        work = TrackWork.find_by_id(work_id)
        if not work:
            raise ResourceNotFoundError(f"Work with ID {work_id} not found.")

        # 7. Get or create StaffUserWork record
        # 8. Update role if changed
        # 9. Set is_active=True
        staff_user_work = StaffUserWork.get_or_create(
            staff_user_id=staff_user.id,
            work_id=work_id,
            role=role
        )

        current_app.logger.info(
            f"Created/updated work assignment: staff_user_id={staff_user.id}, "
            f"work_id={work_id}, role={role}"
        )

        return staff_user_work

    @classmethod
    def remove_staff_user_work(cls, email: str, work_id: int):
        """Remove staff user work assignment.

        Args:
            email: Email address of the staff user
            work_id: Work ID from EPIC.track

        Raises:
            ResourceNotFoundError: If user or work assignment not found
        """
        # 1. Lookup user by email
        try:
            keycloak_user = KeycloakService.get_user_by_email(email)
        except Exception as e:  # noqa: B902
            current_app.logger.error(f"Failed to fetch user from Keycloak: {str(e)}")
            raise ResourceNotFoundError(f"User with email '{email}' not found in Keycloak.") from e

        username = keycloak_user.get("username")
        if not username:
            raise BadRequestError(f"Keycloak user with email '{email}' does not have a valid username.")

        user = User.get_by_guid(username)
        if not user or not user.staff_user:
            raise ResourceNotFoundError(f"Staff user with email '{email}' not found.")

        # 2. Find StaffUserWork record
        staff_user_work = StaffUserWork.find_by_staff_user_and_work(
            staff_user_id=user.staff_user.id,
            work_id=work_id
        )

        if not staff_user_work:
            raise ResourceNotFoundError(
                f"Work assignment not found for staff user '{email}' and work ID {work_id}."
            )

        # 3. Set is_active=False for the assignment
        # 4. Update updated_date and updated_by
        staff_user_work.is_active = False
        staff_user_work.persist()

        current_app.logger.info(
            f"Removed work assignment: staff_user_id={user.staff_user.id}, work_id={work_id}"
        )

        return staff_user_work

    @classmethod
    def get_works_for_staff_user(cls, staff_user_id: int):
        """Get all active work assignments for a staff user.

        Args:
            staff_user_id: ID of the staff user

        Returns:
            list[StaffUserWork]: List of active work assignments
        """
        return StaffUserWork.find_by_staff_user_id(staff_user_id)
