"""Service for staff user work management."""
from flask import current_app

from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import StaffUserWork, TrackWork, User
from submit_api.services.keycloak import KeycloakService
from submit_api.services.staff_user_service import StaffUserService


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
        try:
            role_group_mapping = {
                'TEAM_LEAD': 'SUBMIT/OPS_TEAM_LEAD',
                'TEAM_MEMBER': 'SUBMIT/OPS_TEAM_MEMBER'
            }
            
            keycloak_group = role_group_mapping.get(role)
            if not keycloak_group:
                raise BadRequestError(f"Invalid role '{role}'. Must be TEAM_LEAD or TEAM_MEMBER.")
            
            user_groups = KeycloakService.get_user_groups(username)
            has_role_group = any(group.get('path') == f'/{keycloak_group}'
                                for group in user_groups)
            if not has_role_group:
                group_id = KeycloakService.get_group_id_by_path(keycloak_group)
                KeycloakService.update_user_group(user_id=username, group_id=group_id)
                current_app.logger.info(f"Assigned {keycloak_group} group to user {username}")
            else:
                current_app.logger.info(f"User {username} already has {keycloak_group} group")
        except BadRequestError:
            raise
        except Exception as e:  # noqa: B902  # pylint: disable=broad-exception-caught
            current_app.logger.warning(f"Failed to assign {keycloak_group} group: {str(e)}")
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

    @classmethod
    def get_all_staff_work_roles(cls):
        """Get all active staff work role assignments.

        Returns:
            list[StaffUserWork]: List of all active staff work assignments with staff user and work details
        """
        return StaffUserWork.query.filter_by(is_active=True).all()
