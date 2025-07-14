"""Service for invitations."""
import datetime
import uuid
from urllib.parse import urljoin
from flask import current_app

from submit_api.enums.role import RoleEnum
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import AccountProject as AccountProjectModel, User
from submit_api.models.account import Account as AccountModel
from submit_api.models.db import session_scope
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.models.invitations import Invitations as InvitationsModel, InvitationStatus
from submit_api.models.role import Role as RoleModel
from submit_api.models.account_terms_of_service import TermsOfService as TermsOfServiceModel
from submit_api.models.user import UserType
from submit_api.services.account_user_service import AccountUserService
from submit_api.services.user_service import UserService
from submit_api.utils.constants import NEW_USER_INVITATION_EMAIL_TEMPLATE
from submit_api.utils.token_info import TokenInfo


class InvitationService:
    """Service for managing invitation tokens."""

    @staticmethod
    def generate_uuid_token():
        """Generate a unique UUIDv4 token."""
        return str(uuid.uuid4())

    @staticmethod
    def _check_existing_user(email, account_id):
        """Check if a user with the given email already exists in the account."""
        # Check for active users
        existing_user = AccountUserService.get_users_by_account(
            account_id,
            include_roles=True,
            include_invitees=True
        )

        for user in existing_user:
            work_email = user.get('work_email_address')
            if work_email and work_email.lower() == email.lower():
                return {
                    'status': user.get('status'),
                    'work_email_address': work_email
                }
        return None

    @staticmethod
    def create_invitation(invite_data):
        """Create and persist a new invitation token."""
        email = invite_data.get('email')
        account_id = invite_data.get('account_id')

        # Check for existing user
        existing_user = InvitationService._check_existing_user(email, account_id)
        if existing_user:
            return {
                'success': False,
                'error': 'User already exists',
                'existing_user': existing_user
            }

        token = InvitationService.generate_uuid_token()

        role_name = invite_data.get('role_name')
        proponent_id = invite_data.get('proponent_id')
        project_ids = invite_data.get('project_ids')

        role = InvitationService._validate_fetch_role(role_name)

        with session_scope() as session:
            account = InvitationService._get_or_create_account(
                account_id, proponent_id, project_ids, session)
            session.flush()
            invitation = InvitationService._create_invitation_record(invite_data,
                                                                     role,
                                                                     account,
                                                                     token,
                                                                     session)
            if role.role_name != RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
                InvitationService._create_email_queue_record(
                    invitation.id, session)

            return {
                'success': True,
                'invitation': invitation,
                'url': InvitationService._generate_signup_url(token),
                'role_name': role_name
            }

    @classmethod
    def _create_email_queue_record(cls, invitation_id, session):
        """Create an email queue record for an update request."""
        email_queue = EmailQueueModel(
            entity_id=invitation_id, entity_type=EntityType.INVITATION.value,
            template_name=NEW_USER_INVITATION_EMAIL_TEMPLATE
        )
        session.add(email_queue)
        session.commit()

    @staticmethod
    def accept_invitation(token, payload):
        """Accept an invitation and assign access to an account."""
        invitation = InvitationsModel.validate_token(token)
        if not invitation:
            return {"error": "Invalid invitation token"}
        has_agreed_to_terms = payload.get("has_agreed_to_terms")
        terms_of_service_version_id = payload.get("terms_of_service_version_id")
        # Check if terms were accepted
        if not has_agreed_to_terms:
            raise ValueError("Terms must be accepted to create a user.")

        # Check if the terms_of_service_version_id corresponds to an active record
        terms_record = TermsOfServiceModel.get_active_terms_of_service_by_version(terms_of_service_version_id)
        if not terms_record:
            raise ValueError("Invalid or inactive Terms and Conditions reference.")

        with session_scope() as session:
            user = InvitationService._create_user(payload, session)

            account_user = InvitationService._create_account_user(
                user.id, invitation.account_id, payload, session)

            account_project: AccountProjectModel = AccountProjectModel.get_by_account_id(invitation.account_id)

            role = InvitationService._assign_user_role(
                account_user.id, account_project.id, invitation, session)

            InvitationsModel.mark_used(token, account_user.user_id, session)

            return {
                "message": "User access granted successfully",
                "user_id": account_user.user_id,
                "role": role,
                "account_id": invitation.account_id,
            }

    @staticmethod
    def _validate_fetch_role(role_name):
        """Validate if the given role ID exists, otherwise throw an exception."""
        role = RoleModel.get_by_name(role_name)
        if not role:
            raise ResourceNotFoundError(f"Invalid role name: {role_name}")
        return role

    @staticmethod
    def get_invitation_by_id(invitation_id):
        """Retrieve an invitation by invitation_id."""
        invitation = InvitationsModel.find_by_id(invitation_id)
        InvitationService._validate_invitation_access(invitation)
        return invitation

    @staticmethod
    def _validate_invitation_access(invitation):
        """Validate if the current user has access to the invitation."""
        auth_guid = TokenInfo.get_id()
        user = User.get_by_guid(auth_guid)

        if not user:
            raise ResourceNotFoundError("User not found")

        if user.type == UserType.STAFF.value:
            return True

        if user.type == UserType.PROPONENT.value:
            try:
                if not user.account_user or not user.account_user.account:
                    raise ResourceNotFoundError("User account not found")

                if invitation.account.proponent_id != user.account_user.account.proponent_id:
                    raise ResourceNotFoundError("No access to this invitation")
            except AttributeError as e:
                raise ResourceNotFoundError(
                    "Invalid invitation or user account structure") from e

        return True

    @staticmethod
    def _get_or_create_account(account_id, proponent_id, project_ids, session):
        """Retrieve or create an account based on proponent_id or account_id."""
        if account_id:
            return InvitationService._get_account_by_id(account_id)

        if proponent_id:
            return InvitationService._get_or_create_account_by_proponent(proponent_id, project_ids, session)

        raise ResourceNotFoundError(
            "No valid account found for the provided data.")

    @staticmethod
    def _get_account_by_id(account_id):
        """Retrieve an account by account_id."""
        return AccountModel.find_by_id(account_id)

    @staticmethod
    def _get_or_create_account_by_proponent(proponent_id, project_ids, session):
        """Retrieve or create an account by proponent_id."""
        account = AccountModel.get_by_proponent_id(proponent_id)
        if not account:
            account_data = {'proponent_id': proponent_id}
            account = AccountModel.create_account(account_data, session)
            InvitationService._create_account_projects(
                account.id, project_ids, session)
        return account

    @staticmethod
    def _create_account_projects(account_id, project_ids, session):
        """Create account projects."""
        for project_id in project_ids:
            AccountProjectModel.create_account_project(
                account_id, project_id, session)
        session.flush()

    @staticmethod
    def _create_invitation_record(invite_data, role, account, token, session):
        """Create and persist an invitation record."""
        expiry_days = current_app.config['INVITATION_EXPIRY_DAYS']
        is_first_time = not account.account_users
        invitation = InvitationsModel(
            account_id=account.id,
            project_ids=invite_data.get('project_ids', []),
            token=token,
            email=invite_data.get('email'),
            created_by=invite_data.get('created_by'),
            role_id=role.id,
            package_ids=invite_data.get('package_ids'),
            original_package_ids=invite_data.get('original_package_ids'),
            expiry_date=datetime.datetime.utcnow() + datetime.timedelta(days=expiry_days),
            is_first_time=is_first_time
        )
        session.add(invitation)
        session.commit()
        return invitation

    @staticmethod
    def _create_user(payload, session):
        """Create a user and return the user instance."""
        return UserService.create_user({
            "auth_guid": payload.get("auth_guid"),
            "type": UserType.PROPONENT  # TODO: Change this to accept user type from the invitation
        }, session)

    @staticmethod
    def _create_account_user(user_id, account_id, payload, session):
        """Create an account user entry."""
        return AccountUserService.create_account_user({
            "account_id": account_id,
            "first_name": payload.get("first_name"),
            "last_name": payload.get("last_name"),
            "work_email_address": payload.get("work_email_address"),
            "work_contact_number": payload.get("work_contact_number"),
            "position": payload.get("position"),
            "user_id": user_id,
            "extension_number": payload.get("extension_number"),
            "terms_of_service_version_id": payload.get("terms_of_service_version_id")
        }, session)

    @staticmethod
    def _assign_user_role(account_user_id, account_project_id, invitation, session):
        """Assign the role to the user."""
        return AccountUserService.assign_role({
            "account_user_id": account_user_id,
            "role_id": invitation.role_id,
            "account_project_id": account_project_id,
            "package_ids": invitation.package_ids,
            "original_package_ids": invitation.package_ids
        }, session)

    @staticmethod
    def _generate_signup_url(token):
        """Generate a full URL with token for invitation."""
        base_url = current_app.config['BASE_APP_URL']
        signup_path = current_app.config.get(
            'SIGNUP_URL_PATH', '/proponent/registration')

        # Construct the URL by joining base, path, and token
        return urljoin(base_url, f"{signup_path}?token={token}")

    @staticmethod
    def get_valid_invitation(token):
        """Retrieve and validate an invitation by token, checking both status and expiry."""
        invitation = InvitationsModel.query.filter_by(token=token).first()

        if not invitation:
            return {"error": "Invalid invitation"}, False

        # Check for pending status and expiry date
        if invitation.status != InvitationStatus.PENDING.value:
            return {"error": "Invitation is not valid"}, False

        if invitation.expiry_date < datetime.datetime.utcnow():
            return {"error": "Invitation has expired"}, False

        return invitation, True

    @staticmethod
    def revoke_invitation(token):
        """Revoke an invitation by updating its status."""
        invitation = InvitationsModel.query.filter_by(
            token=token, status=InvitationStatus.PENDING.value).first()
        if invitation:
            invitation.status = InvitationStatus.REVOKED.value
            InvitationsModel.commit()
            return True
        return False

    @staticmethod
    def resend_invitation(token):
        """Resend an invitation and extend its expiry date by a week."""
        with session_scope() as session:
            invitation = InvitationsModel.query.filter_by(token=token).first()

            if not invitation or invitation.status != InvitationStatus.PENDING.value:
                return False

            # Extend expiry date by 1 week from current date
            invitation.expiry_date = datetime.datetime.utcnow() + datetime.timedelta(weeks=1)

            # Create new email queue record for resending
            if invitation.role.role_name != RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
                InvitationService._create_email_queue_record(
                    invitation.id, session)

            session.add(invitation)
            return True
