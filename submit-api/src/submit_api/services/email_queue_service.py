"""Build and queue Submit email jobs."""
from urllib.parse import urljoin
from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from flask import current_app

from submit_api.enums.item_status import ItemStatus
from submit_api.enums.role import RoleEnum
from submit_api.exceptions import BadRequestError
from submit_api.models import AccountProject
from submit_api.models.account_user import AccountUser as AccountUserModel
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.models.invitations import Invitations as InvitationsModel
from submit_api.models.package import Package as PackageModel
from submit_api.models.project import Project as ProjectModel
from submit_api.models.role import Role as RoleModel
from submit_api.models.submission import SubmissionType
from submit_api.models.submission_review_entry import SubmissionReviewEntry
from submit_api.models.submission_review_entry import SubmissionReviewEntryType
from submit_api.models.user_role import UserRole as UserRoleModel
from submit_api.services.auth_service import AuthService
from submit_api.utils.constants import (
    MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE,
    MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE,
    MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE,
    MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE,
    NEW_USER_INVITATION_ACCOUNT_ADMIN_EMAIL_TEMPLATE,
    NEW_USER_INVITATION_COLLABORATOR_EMAIL_TEMPLATE,
    NEW_USER_INVITATION_PROJECT_ADMIN_EMAIL_TEMPLATE,
    SUBMISSION_AWAITING_MANAGER_APPROVAL_EMAIL_TEMPLATE,
    SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP,
    SUBMISSION_PACKAGE_TYPE_SENDER_MAP,
)


EAO_MANAGER_GROUP_PATH = "SUBMIT/MPT_MANAGER"


class SubmitEmailQueueService:
    """Create email queue rows with all data needed by the mailer."""

    @classmethod
    def queue_package_submission_emails(cls, package: PackageModel, session=None):
        """Queue proponent and staff emails for a submitted package."""
        return [
            cls.queue_package_email(
                package.id,
                MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE,
                session=session,
                package=package,
            ),
            cls.queue_package_email(
                package.id,
                MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE,
                session=session,
                package=package,
            ),
        ]

    @classmethod
    def queue_package_email(cls, package_id: int, template_name: str, session=None, package: PackageModel = None):
        """Queue one package-related email by template."""
        package = package or cls._get_package(package_id, session)
        if not package:
            raise BadRequestError(f"Package with ID {package_id} not found.")

        if template_name in (
            MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE,
            MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE,
        ):
            payload = cls._build_package_submission_payload(package, template_name)
        elif template_name == MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE:
            payload = cls._build_update_request_payload(package)
        elif template_name == MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE:
            payload = cls._build_resubmission_request_payload(package)
        elif template_name == SUBMISSION_AWAITING_MANAGER_APPROVAL_EMAIL_TEMPLATE:
            payload = cls._build_awaiting_manager_approval_payload(package)
        else:
            raise BadRequestError(f"Unsupported email template: {template_name}")

        return cls._create_email_queue(
            entity_id=package.id,
            entity_type=EntityType.PACKAGE.value,
            template_name=template_name,
            payload=payload,
            session=session,
        )

    @classmethod
    def queue_invitation_email(cls, invitation_id: int, session=None, invitation: InvitationsModel = None):
        """Queue an invitation email."""
        invitation = invitation or cls._get_invitation(invitation_id, session)
        if not invitation:
            raise BadRequestError(f"Invitation with ID {invitation_id} not found.")

        return cls._create_email_queue(
            entity_id=invitation.id,
            entity_type=EntityType.INVITATION.value,
            template_name=cls._get_invitation_template(invitation),
            payload=cls._build_invitation_payload(invitation),
            session=session,
        )

    @classmethod
    def _build_package_submission_payload(cls, package: PackageModel, template_name: str) -> dict:
        submitter = cls._get_submitter(package)
        sender_email = cls._get_sender_email(package)
        account_project = cls._get_account_project(package.account_project_id)
        project = cls._get_project(account_project)
        document_names = cls._get_document_names(package)
        body_args = {
            'project_name': project.name,
            'submitter_name': submitter.full_name if submitter else '',
            'submission_date': cls._format_submission_date(package.submitted_on),
            'certificate_holder_name': project.proponent.name if project.proponent else '',
            'package_name': package.name,
            'documents': document_names,
        }

        if template_name == MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE:
            recipients = cls._as_recipients(current_app.config.get('STAFF_SUPPORT_MAIL_ID'))
            subject = f"SUBMISSION - {project.name} - {package.name} - {package.submitted_on.strftime('%Y-%m-%d')}"
        else:
            recipients = cls._as_recipients(submitter.work_email_address if submitter else None)
            subject = f"Confirmation of receipt for {package.name}"

        return cls._payload(sender_email, recipients, subject, body_args)

    @classmethod
    def _build_update_request_payload(cls, package: PackageModel) -> dict:
        submitter = cls._get_submitter(package)
        sender_email = cls._get_sender_email(package)
        sender_name = cls._get_sender_name(package)
        body_args = {
            'epic_submit_link': cls._get_base_url(),
            'submitter_name': submitter.full_name if submitter else '',
            'package_name': package.name,
            'sender_name': sender_name,
        }
        return cls._payload(
            sender_email,
            cls._as_recipients(submitter.work_email_address if submitter else None),
            'Action Required: Update Your Submission',
            body_args,
        )

    @classmethod
    def _build_resubmission_request_payload(cls, package: PackageModel) -> dict:
        recipients = [user.work_email_address for user in cls._get_project_admin_users(package)]
        submission_link = (
            f"{cls._get_base_url()}/proponent/projects/"
            f"{package.account_project_id}/submission-packages/{package.id}"
        )
        body_args = {
            'submission_link': submission_link,
            'package_name': package.name,
        }
        return cls._payload(
            current_app.config.get('SENDER_EMAIL'),
            recipients,
            f'Invitation to resubmit a new version of {package.name} in EPIC.submit',
            body_args,
        )

    @classmethod
    def _build_awaiting_manager_approval_payload(cls, package: PackageModel) -> dict:
        manager_emails = cls._get_eao_manager_emails()
        account_project = cls._get_account_project(package.account_project_id)
        project = cls._get_project(account_project)
        body_args = {
            'package_name': package.name,
            'project_name': project.name,
            'team_member_name': cls._get_reviewer_name(package),
        }
        return cls._payload(
            cls._get_sender_email(package, fallback_config='SENDER_EMAIL'),
            manager_emails,
            f"Submission awaiting Manager approval - {project.name} - {package.name}",
            body_args,
        )

    @classmethod
    def _build_invitation_payload(cls, invitation: InvitationsModel) -> dict:
        project = cls._get_project_for_invitation(invitation)
        invitation_action_text = cls._get_invitation_action_text(invitation)
        body_args = {
            'epic_submit_link': cls._get_base_url(),
            'invitation_url': cls._build_signup_url(invitation.token),
            'project_name': project.name or '',
            'bc_service_card_url': current_app.config.get('BC_SERVICE_CARD_URL', 'https://id.gov.bc.ca'),
            'certificate_holder_name': (project.proponent.name if project.proponent else '') or '',
            'invitation_action_text': invitation_action_text,
        }
        return cls._payload(
            current_app.config.get('SENDER_EMAIL'),
            cls._as_recipients(invitation.email),
            'Invitation to collaborate on EPIC.submit',
            body_args,
        )

    @staticmethod
    def _get_invitation_template(invitation: InvitationsModel) -> str:
        if invitation.role.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
            return NEW_USER_INVITATION_ACCOUNT_ADMIN_EMAIL_TEMPLATE
        if invitation.role.role_name == RoleEnum.PROJECT_ADMIN.value:
            return NEW_USER_INVITATION_PROJECT_ADMIN_EMAIL_TEMPLATE
        if invitation.role.role_name in (
            RoleEnum.SUBMISSION_ADMIN.value,
            RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value,
        ):
            return NEW_USER_INVITATION_COLLABORATOR_EMAIL_TEMPLATE
        raise BadRequestError(f"Unsupported invitation role: {invitation.role.role_name}")

    @staticmethod
    def _payload(sender: str, recipients: list[str], subject: str, body_args: dict) -> dict:
        if not sender:
            raise BadRequestError("Email sender is required")
        if not recipients:
            raise BadRequestError("At least one email recipient is required")
        if not subject:
            raise BadRequestError("Email subject is required")
        return {
            'sender': sender,
            'recipients': recipients,
            'subject': subject,
            'body_args': body_args,
            'cc': [],
            'bcc': [],
        }

    @staticmethod
    def _as_recipients(email: str | None) -> list[str]:
        return [email] if email else []

    @staticmethod
    def _create_email_queue(entity_id: int, entity_type: str, template_name: str, payload: dict, session=None):
        email_queue = EmailQueueModel(
            entity_id=entity_id,
            entity_type=entity_type,
            template_name=template_name,
            payload=payload,
        )
        if session:
            session.add(email_queue)
            return email_queue
        email_queue.save()
        return email_queue

    @staticmethod
    def _get_package(package_id: int, session=None):
        if session:
            return session.get(PackageModel, package_id)
        return PackageModel.find_by_id(package_id)

    @staticmethod
    def _get_invitation(invitation_id: int, session=None):
        if session:
            return session.get(InvitationsModel, invitation_id)
        return InvitationsModel.find_by_id(invitation_id)

    @staticmethod
    def _get_base_url() -> str:
        base_url = (
            current_app.config.get('BASE_APP_URL') or
            current_app.config.get('WEB_URL') or
            current_app.config.get('SITE_URL')
        )
        return base_url.rstrip('/') if base_url else ''

    @staticmethod
    def _build_signup_url(token: str) -> str:
        signup_path = current_app.config.get('SIGNUP_URL_PATH') or '/proponent/registration'
        return urljoin(f"{SubmitEmailQueueService._get_base_url()}/", f"{signup_path.lstrip('/')}?token={token}")

    @staticmethod
    def _format_submission_date(submitted_on: datetime) -> str:
        if not submitted_on:
            return ''
        if submitted_on.tzinfo is None:
            submitted_on = submitted_on.replace(tzinfo=UTC)
        timezone = ZoneInfo(current_app.config.get('LEGISLATIVE_TIMEZONE', 'US/Pacific'))
        return submitted_on.astimezone(timezone).strftime('%Y-%m-%d %I:%M %p %Z')

    @staticmethod
    def _get_sender_email(package: PackageModel, fallback_config: str = 'SENDER_EMAIL') -> str:
        sender = SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP.get(package.type.name)
        if not sender and fallback_config:
            sender = current_app.config.get(fallback_config)
        if not sender:
            raise BadRequestError(f"Sender email not found for package type: {package.type.name}")
        return sender

    @staticmethod
    def _get_sender_name(package: PackageModel) -> str:
        sender_name = SUBMISSION_PACKAGE_TYPE_SENDER_MAP.get(package.type.name)
        return sender_name or package.type.name

    @staticmethod
    def _get_submitter(package: PackageModel) -> AccountUserModel:
        if package.submitted_by_user and package.submitted_by_user.account_user:
            return package.submitted_by_user.account_user
        submitter = AccountUserModel.get_by_guid(package.submitted_by)
        return submitter

    @staticmethod
    def _get_account_project(account_project_id: int) -> AccountProject:
        account_project = AccountProject.query.filter_by(id=account_project_id).first()
        if not account_project:
            raise BadRequestError(f"Account project with ID {account_project_id} not found")
        return account_project

    @staticmethod
    def _get_project(account_project: AccountProject) -> ProjectModel:
        project = account_project.project
        if not project:
            raise BadRequestError(f"Project not found for account project ID: {account_project.id}")
        return project

    @staticmethod
    def _get_document_names(package: PackageModel) -> list[str]:
        return [
            submission.submitted_document.name
            for item in package.items
            for submission in item.submissions
            if submission.type == SubmissionType.DOCUMENT and submission.submitted_document
        ]

    @staticmethod
    def _get_project_admin_users(package: PackageModel) -> list[AccountUserModel]:
        admin_role_names = [RoleEnum.PROJECT_ADMIN.value, RoleEnum.ACCOUNT_PRIMARY_ADMIN.value]
        admin_roles = RoleModel.query.filter(RoleModel.role_name.in_(admin_role_names)).all()
        admin_role_ids = [role.id for role in admin_roles]
        if not admin_role_ids:
            return []

        admin_users = (
            AccountUserModel.query
            .join(UserRoleModel, AccountUserModel.id == UserRoleModel.account_user_id)
            .filter(
                UserRoleModel.account_project_id == package.account_project_id,
                UserRoleModel.role_id.in_(admin_role_ids),
                UserRoleModel.active,
            )
            .all()
        )
        return admin_users

    @staticmethod
    def _get_eao_manager_emails() -> list[str]:
        try:
            members = AuthService.get_group_members("SUBMIT", "MPT_MANAGER")
        except (ValueError, OSError):
            return []
        return [member.get('email') for member in members if member.get('email')]

    @staticmethod
    def _get_reviewer_name(package: PackageModel) -> str:
        awaiting_statuses = (
            ItemStatus.MP_AWAITING_MANAGER_APPROVAL,
            ItemStatus.CC_AWAITING_MANAGER_APPROVAL,
        )
        for item in package.items:
            if item.status not in awaiting_statuses:
                continue
            review = item.review
            if not review:
                continue
            entry = SubmissionReviewEntry.get_review_entry_by_id_and_type(
                review.id,
                SubmissionReviewEntryType.STAFF_RECOMMENDATION,
            )
            if not entry or not entry.updated_by:
                continue
            user = entry.updated_by_user
            if user and user.staff_user:
                return user.staff_user.full_name or entry.updated_by
            return entry.updated_by
        return 'a team member'

    @staticmethod
    def _get_project_for_invitation(invitation: InvitationsModel) -> ProjectModel:
        if invitation.project_ids:
            projects = ProjectModel.get_all_projects_in_ids(invitation.project_ids)
            project = projects[0] if projects else None
        elif invitation.package_ids:
            package = PackageModel.find_by_id(invitation.package_ids[0])
            account_project = (
                SubmitEmailQueueService._get_account_project(package.account_project_id)
                if package else None
            )
            project = account_project.project if account_project else None
        else:
            raise BadRequestError("No project or package IDs provided in the invitation.")

        if not project:
            raise BadRequestError(f"Project was not found for invitation id: {invitation.id}")
        return project

    @staticmethod
    def _get_invitation_action_text(invitation: InvitationsModel) -> str:
        if not invitation.role:
            return "join"
        if invitation.role.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value:
            return "manage"
        if invitation.role.role_name == RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value:
            return "collaborate on"
        return "join"
