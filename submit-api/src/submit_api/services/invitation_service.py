"""Service for invitations."""
import datetime
import uuid
from submit_api.models.invitations import Invitations as InvitationsModel


class InvitationService:
    """Service for managing invitation tokens."""

    @staticmethod
    def generate_uuid_token():
        """Generate a unique UUIDv4 token."""
        return str(uuid.uuid4())

    @staticmethod
    def create_invitation(account_id, project_ids, email=None, created_by=None):
        """Create and persist a new invitation token."""

        # Generate UUID token internally
        token = InvitationService.generate_uuid_token()

        # Create and persist the invitation
        invitation = InvitationsModel(
            account_id=account_id,
            project_ids=",".join(map(str, project_ids)),
            token=token,
            email=email,
            created_by=created_by,
            expiry_date=datetime.datetime.utcnow() + datetime.timedelta(days=7),
        )
        InvitationsModel.save(invitation)
        return invitation

    @staticmethod
    def get_by_token(token):
        """Retrieve an invitation by its token."""
        invitation = InvitationsModel.query.filter_by(token=token).first()

        # Automatically handle expiration
        if invitation and invitation.expiry_date < datetime.datetime.utcnow():
            invitation.status = 'expired'
            InvitationsModel.commit()
            return None

        return invitation

    @staticmethod
    def revoke_invitation(token):
        """Revoke an invitation by updating its status."""
        invitation = InvitationsModel.query.filter_by(token=token, status='pending').first()
        if invitation:
            invitation.status = 'revoked'
            InvitationsModel.commit()
            return True
        return False
