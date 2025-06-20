from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.package import Package as PackageModel
from submit_api.models.account_user import AccountUser as AccountUserModel
from submit_api.utils.constants import MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE
from submit_api.models.account_project import AccountProject as AccountProjectModel
from submit_api.services.account_user_service import AccountUserService
from submit_api.enums.role import RoleEnum


class ResubmissionEmailService:
    """Handles sending email notifications for resubmission requests."""

    @classmethod
    def get_project_admin_users(cls, package: PackageModel) -> list[dict]:
        """Get all PROJECT_ADMIN users for the package's account project."""
        # Get the account_id from the package's account_project
        account_project = AccountProjectModel.get_by_id(package.account_project_id)
        if not account_project:
            raise BadRequestError("Account project not found")

        # Get all users for this account with roles included
        users_data = AccountUserService.get_users_by_account(
            account_project.account_id, 
            include_roles=True, 
            include_invitees=False
        )

        # Filter for PROJECT_ADMIN users
        project_admin_users = []
        for user_data in users_data:
            role = user_data.get('role')
            if (role and 
                role.get('active') and 
                role.get('role', {}).get('role_name') == RoleEnum.PROJECT_ADMIN.value):
                project_admin_users.append(user_data)
  
        return project_admin_users


    @classmethod
    def prepare_resubmission_request_email(cls, package: PackageModel, account_user: AccountUserModel) -> EmailDetails:
        """Prepare email details for resubmission request for a specific user."""
        web_url = current_app.config.get('WEB_URL')
        submission_link = f"{web_url}/proponent/projects/{package.account_project_id}/submission-packages/{package.id}"

        email_details = EmailDetails(
            template_name=MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE,
            body_args={
                'submission_link': submission_link,
                'submitter_name': account_user.full_name,
                'package_name': package.name,
            },
            subject=f'Invitation to resubmit a new version of {package.name} in EPIC.submit',
            sender=current_app.config.get('SENDER_EMAIL'),
            recipients=[account_user.work_email_address],
        )

        return email_details
