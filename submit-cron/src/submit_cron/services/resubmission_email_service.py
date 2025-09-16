from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.package import Package as PackageModel
from submit_api.models.account_user import AccountUser as AccountUserModel
from submit_api.models.user_role import UserRole as UserRoleModel
from submit_api.models.role import Role as RoleModel
from submit_api.utils.constants import MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE
from submit_api.enums.role import RoleEnum
from submit_cron.models import db


class ResubmissionEmailService:
    """Handles sending email notifications for resubmission requests."""

    @classmethod
    def get_project_admin_users(cls, package: PackageModel) -> list[AccountUserModel]:
        """Get all PROJECT_ADMIN users for the package's account project."""
        # Get the account_project_id from the package
        account_project_id = package.account_project_id
        current_app.logger.info(f"Looking for project admin users for account_project_id: {account_project_id}")
   
        # Get the PROJECT_ADMIN role using direct query
        project_admin_role = (
            db.session.query(RoleModel)
            .filter(RoleModel.role_name == RoleEnum.PROJECT_ADMIN.value)
            .first()
        )
        if not project_admin_role:
            current_app.logger.error(f"Project admin role not found for role_name: {RoleEnum.PROJECT_ADMIN.value}")
            raise BadRequestError("Project admin role not found")
        
        current_app.logger.info(f"Found project admin role with ID: {project_admin_role.id}")

        # Query for all project admin users for this specific account project
        project_admin_users = (
            db.session.query(AccountUserModel)
            .join(UserRoleModel, AccountUserModel.id == UserRoleModel.account_user_id)
            .filter(
                UserRoleModel.account_project_id == account_project_id,
                UserRoleModel.role_id == project_admin_role.id,
                UserRoleModel.active
            )
            .all()
        )

        current_app.logger.info(f"Found {len(project_admin_users)} project admin users for account_project_id: {account_project_id}")
        
        if not project_admin_users:
            current_app.logger.warning(f"No project admins found for account_project_id: {account_project_id}")
            raise BadRequestError("No project admins found for this account project")

        # Log the email addresses of found users for debugging
        email_addresses = [user.work_email_address for user in project_admin_users]
        current_app.logger.info(f"Project admin email addresses: {email_addresses}")

        return project_admin_users

    @classmethod
    def prepare_resubmission_request_email(cls, package: PackageModel, project_admin_users: list[AccountUserModel]) -> EmailDetails:
        """Prepare email details for resubmission request for all project admin users."""
        if not package.submitted_by_user or not package.submitted_by_user.account_user:
            raise BadRequestError(f"Submitter with auth_guid {package.submitted_by} not found")
        web_url = current_app.config.get('WEB_URL')
        submission_link = f"{web_url}/proponent/projects/{package.account_project_id}/submission-packages/{package.id}"
        # Get all email addresses from project admin users
        recipient_emails = [user.work_email_address for user in project_admin_users]

        email_details = EmailDetails(
            template_name=MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE,
            body_args={
                'submission_link': submission_link,
                'package_name': package.name,
            },
            subject=f'Invitation to resubmit a new version of {package.name} in EPIC.submit',
            sender=current_app.config.get('SENDER_EMAIL'),
            recipients=recipient_emails,
        )

        return email_details
