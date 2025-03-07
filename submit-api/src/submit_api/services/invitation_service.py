"""Service for invitations."""
import datetime
import uuid
from urllib.parse import urljoin

from flask import current_app

from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import AccountProject as AccountProjectModel
from submit_api.models.account import Account as AccountModel
from submit_api.models.db import session_scope
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.models.invitations import Invitations as InvitationsModel, InvitationStatus
from submit_api.models.role import Role as RoleModel
from submit_api.models.role import RoleEnum
from submit_api.models.user import UserType
from submit_api.services.account_user_service import AccountUserService
from submit_api.services.user_service import UserService
from submit_api.utils.constants import NEW_USER_INVITATION_EMAIL_TEMPLATE


class InvitationService:
    """Service for managing invitation tokens."""

    @staticmethod
    def generate_uuid_token():
        """Generate a unique UUIDv4 token."""
        return str(uuid.uuid4())

    @staticmethod
    def create_invitation(invite_data):
        """Create and persist a new invitation token."""
        token = InvitationService.generate_uuid_token()

        role_id = invite_data.get('role_id')
        account_id = invite_data.get('account_id')
        proponent_id = invite_data.get('proponent_id')
        project_ids = invite_data.get('project_ids')

        role = InvitationService._validate_fetch_role(role_id)

        with session_scope() as session:
            account = InvitationService._get_or_create_account(account_id, proponent_id, project_ids, session)
            session.flush()
            invitation = InvitationService._create_invitation_record(invite_data, account.id, token, session)
            role.role_name != RoleEnum.ACCOUNT_PRIMARY_ADMIN.value and \
                InvitationService._create_email_queue_record(invitation.id)

            return {
                'invitation': invitation,
                'url': InvitationService._generate_signup_url(token)
            }

    @classmethod
    def _create_email_queue_record(cls, invitation_id):
        """Create an email queue record for an update request."""
        email_queue = EmailQueueModel(
            entity_id=invitation_id, entity_type=EntityType.INVITATION.value,
            template_name=NEW_USER_INVITATION_EMAIL_TEMPLATE
        )
        email_queue.save()

    @classmethod
    def _create_email_queue_record(cls, invitation_id):
        """Create an email queue record for an update request."""
        email_queue = EmailQueueModel(
            entity_id=invitation_id, entity_type=EntityType.INVITATION.value,
            template_name=NEW_USER_INVITATION_EMAIL_TEMPLATE
        )
        email_queue.save()

    @staticmethod
    def accept_invitation(token, payload):
        """Accept an invitation and assign access to an account."""
        invitation = InvitationsModel.validate_token(token)
        if not invitation:
            return {"error": "Invalid invitation token"}

        with session_scope() as session:
            user = InvitationService._create_user(payload, session)

            account_user = InvitationService._create_account_user(user.id, invitation.account_id, payload, session)

            role = InvitationService._assign_user_role(account_user.id, invitation, session)

            InvitationsModel.mark_used(token, account_user.user_id, session)

            return {
                "message": "User access granted successfully",
                "user_id": account_user.user_id,
                "role": role
            }

    @staticmethod
    def _validate_fetch_role(role_id):
        """Validate if the given role ID exists, otherwise throw an exception."""
        role = RoleModel.find_by_id(role_id)
        if not role:
            raise ResourceNotFoundError(f"Invalid role ID: {role_id}")
        return role

    @staticmethod
    def _get_or_create_account(account_id, proponent_id, project_ids, session):
        """Retrieve or create an account based on proponent_id or account_id."""
        if account_id:
            return InvitationService._get_account_by_id(account_id)

        if proponent_id:
            return InvitationService._get_or_create_account_by_proponent(proponent_id, project_ids, session)

        raise ResourceNotFoundError("No valid account found for the provided data.")

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
            InvitationService._create_account_projects(account.id, project_ids, session)
        return account

    @staticmethod
    def _create_account_projects(account_id, project_ids, session):
        """Create account projects."""
        for project_id in project_ids:
            AccountProjectModel.create_account_project(account_id, project_id, session)
        session.flush()

    @staticmethod
    def _create_invitation_record(invite_data, account_id, token, session):
        """Create and persist an invitation record."""
        expiry_days = current_app.config['INVITATION_EXPIRY_DAYS']

        invitation = InvitationsModel(
            account_id=account_id,
            project_ids=",".join(map(str, invite_data.get('project_ids', []))),
            token=token,
            email=invite_data.get('email'),
            created_by=invite_data.get('created_by'),
            role_id=invite_data.get('role_id'),
            package_ids=invite_data.get('package_ids'),
            expiry_date=datetime.datetime.utcnow() + datetime.timedelta(days=expiry_days),
        )
        session.add(invitation)
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
            "user_id": user_id
        }, session)

    @staticmethod
    def _assign_user_role(account_user_id, invitation, session):
        """Assign the role to the user."""
        return AccountUserService.assign_role({
            "account_user_id": account_user_id,
            "role_id": invitation.role_id,
            "account_project_id": None,  # TODO: Add account_project_ids for users onboarded by project admin
            "package_ids": invitation.package_ids,
        }, session)

    @staticmethod
    def _generate_signup_url(token):
        """Generate a full URL with token for invitation."""
        base_url = current_app.config['BASE_APP_URL']
        signup_path = current_app.config.get('SIGNUP_URL_PATH', '/signup')

        # Construct the URL by joining base, path, and token
        return urljoin(base_url, f"{signup_path}/{token}")

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
        invitation = InvitationsModel.query.filter_by(token=token, status='pending').first()
        if invitation:
            invitation.status = InvitationStatus.REVOKED.value
            InvitationsModel.commit()
            return True
        return False
