from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.invitations import Invitations as InvitationsModel
from submit_api.models.project import Project as ProjectModel

from submit_cron.models import db
from submit_cron.utils.constants import NEW_USER_INVITATION_EMAIL_TEMPLATE
from urllib.parse import urljoin


class InvitationEmailService:  # pylint: disable=too-few-public-methods
    """Handles sending email notifications for new user invitation."""

    @classmethod
    def prepare_invitation_email_notification(cls, invitation: InvitationsModel) -> EmailDetails:
        """Prepare email details for update request creation."""
        project_name = cls.get_project_names(invitation.project_ids)
        if not project_name:
            raise BadRequestError(f"Project name not found for invitation id: {invitation.id}")

        invitation_url = cls.generate_signup_url(invitation.token)

        email_details = EmailDetails(
            template_name=NEW_USER_INVITATION_EMAIL_TEMPLATE,
            body_args={
                'epic_submit_link': current_app.config.get('WEB_URL'),
                'invitation_url': invitation_url,
                'project_name': project_name,
            },
            subject='Invitation to collaborate on EPIC.submit',
            sender=current_app.config.get('SENDER_EMAIL'),
            recipients=[invitation.email],
        )

        return email_details

    @staticmethod
    def get_project_names(project_ids: str) -> str:
        """Fetch project names as a comma-separated string for given project IDs."""
        project_id_list = [int(pid) for pid in project_ids if isinstance(pid, (int, str)) and str(pid).isdigit()]

        projects = db.session.query(ProjectModel.name).filter(ProjectModel.id.in_(project_id_list)).all()

        return ", ".join(p.name for p in projects)

    @staticmethod
    def generate_signup_url(token):
        """Generate a full URL with token for invitation."""
        base_url = current_app.config['WEB_URL']
        signup_path = current_app.config.get('SIGNUP_URL_PATH', '/signup')

        # Construct the URL by joining base, path, and token
        return urljoin(base_url, f"{signup_path}/{token}")
