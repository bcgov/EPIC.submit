"""Service for invitations."""
import datetime
import uuid
from urllib.parse import urljoin

from flask import current_app

from submit_api.models.invitations import Invitations as InvitationsModel
from submit_api.models.account import Account as AccountModel


class InvitationService:
    """Service for managing invitation tokens."""

    @staticmethod
    def generate_uuid_token():
        """Generate a unique UUIDv4 token."""
        return str(uuid.uuid4())

    @staticmethod
    def create_invitation(proponent_id, project_ids, email=None, created_by=None):
        """Create and persist a new invitation token."""
        # Generate UUID token internally
        token = InvitationService.generate_uuid_token()
        # Check presence of an account for this proponent and if doesn't exist ,create an account
        # if exists , use the existing account
        account: AccountModel = AccountModel.get_by_proponent_id(proponent_id)
        if not account:
            account_data = {'proponent_id': proponent_id}
            account = AccountModel.create_account(account_data)

        # 7 days is set as default..override in openshift enviroment if necessary
        expiry_days = current_app.config['INVITATION_EXPIRY_DAYS']

        # Create and persist the invitation
        invitation = InvitationsModel(
            account_id=account.id,
            project_ids=",".join(map(str, project_ids)),
            token=token,
            email=email,
            created_by=created_by,
            expiry_date=datetime.datetime.utcnow() + datetime.timedelta(days=expiry_days),
        )
        InvitationsModel.save(invitation)

        invitation_url = InvitationService._generate_signup_url(token)

        return {
            'invitation': invitation,
            'url': invitation_url
        }

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
        if invitation.status != 'pending':
            return {"error": "Invitation is not valid"}, False

        if invitation.expiry_date < datetime.datetime.utcnow():
            return {"error": "Invitation has expired"}, False

        return invitation, True

    @staticmethod
    def revoke_invitation(token):
        """Revoke an invitation by updating its status."""
        invitation = InvitationsModel.query.filter_by(token=token, status='pending').first()
        if invitation:
            invitation.status = 'revoked'
            InvitationsModel.commit()
            return True
        return False
