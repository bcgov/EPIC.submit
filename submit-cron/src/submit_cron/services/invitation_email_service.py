from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.invitations import Invitations as InvitationsModel
from submit_api.models.package import Package as PackageModel
from submit_api.models.project import Project as ProjectModel
from submit_api.enums.role import RoleEnum
from submit_api.models.account_project import AccountProject as AccountProjectModel

from submit_cron.models import db
from submit_cron.utils.constants import NEW_USER_INVITATION_EMAIL_TEMPLATE
from urllib.parse import urljoin


class InvitationEmailService:  # pylint: disable=too-few-public-methods
    """Handles sending email notifications for new user invitation."""

    @classmethod
    def prepare_invitation_email_notification(cls, invitation: InvitationsModel) -> EmailDetails:
        """Prepare email details for update request creation."""

        bceid_link = current_app.config.get('BCEID_URL', 'https://www.bceid.ca/')
        project = None
        project_name = None

        if invitation.project_ids:
            project_name = cls.get_project_names(invitation.project_ids)
        elif invitation.package_ids:
            project_name = cls.get_project_names_for_package_id(invitation.package_ids)
        elif invitation.account_id:
            project = cls.get_project_for_account_id(invitation.account_id)
            if project:
                project_name = project.name

        if not project_name and not project:
            raise BadRequestError(f"Project was not found for invitation id: {invitation.id}")

        invitation_url = cls.generate_signup_url(invitation.token)

        email_details = EmailDetails(
            template_name=NEW_USER_INVITATION_EMAIL_TEMPLATE,
            body_args={
                'epic_submit_link': current_app.config.get('WEB_URL'),
                'invitation_url': invitation_url,
                'project_name': project_name if project_name else project.name,
                'bceid_link': bceid_link,
                'certificate_holder_name': project.proponent_name if project else None,
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
    def get_project_names_for_package_id(package_ids: list) -> str:
        """Fetch project names as a comma-separated string for given package IDs."""
        if not isinstance(package_ids, list) or not package_ids:
            return ""

        package_id = package_ids[0]  # we dont have multiple projects so far , so just take any package id

        project_name = (
            db.session.query(ProjectModel.name)
            .join(AccountProjectModel, ProjectModel.id == AccountProjectModel.project_id)
            .join(PackageModel, AccountProjectModel.id == PackageModel.account_project_id)
            .filter(PackageModel.id == package_id)
            .scalar()
        )

        return project_name or ""

    @staticmethod
    def get_project_for_account_id(account_id: int) -> ProjectModel:
        """Fetch the full ProjectModel instance for a given account ID."""
        if not account_id:
            return None

        project = (
            db.session.query(ProjectModel)
            .join(AccountProjectModel, ProjectModel.id == AccountProjectModel.project_id)
            .filter(AccountProjectModel.account_id == account_id)
            .first()
        )

        return project

    @staticmethod
    def generate_signup_url(token):
        """Generate a full URL with token for invitation."""
        base_url = current_app.config['WEB_URL']
        signup_path = current_app.config.get('SIGNUP_URL_PATH', '/proponent/registration')

        # Construct the URL by joining base, path, and token
        return urljoin(base_url, f"{signup_path}?token={token}")
