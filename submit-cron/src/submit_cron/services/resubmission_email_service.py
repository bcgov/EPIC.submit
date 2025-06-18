from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.package import Package as PackageModel
from submit_api.models.user_role import UserRole as UserRoleModel
from submit_api.models.role import Role as RoleModel
from submit_api.models.account_user import AccountUser as AccountUserModel
from submit_api.enums.role import RoleEnum
from submit_api.utils.constants import MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE


class ResubmissionEmailService:
    """Handles sending email notifications for resubmission requests."""

    @classmethod
    def get_project_admin_users(cls, package: PackageModel) -> list[AccountUserModel]:
        """Get all PROJECT_ADMIN users for the package's account project."""
        account_project_id = package.account_project_id
        
        project_admin_role = RoleModel.get_by_name(RoleEnum.PROJECT_ADMIN.value)
        if not project_admin_role:
            raise BadRequestError("PROJECT_ADMIN role not found")
        
        project_admin_users = (
            UserRoleModel.query
            .join(UserRoleModel.account_user)
            .filter(
                UserRoleModel.role_id == project_admin_role.id,
                UserRoleModel.account_project_id == account_project_id,
                UserRoleModel.active == True
            )
            .all()
        )
        
        return [user_role.account_user for user_role in project_admin_users]

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
