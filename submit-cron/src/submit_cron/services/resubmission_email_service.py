from flask import current_app
from submit_api.data_classes.email_details import EmailDetails
from submit_api.exceptions import BadRequestError
from submit_api.models.package import Package as PackageModel
from submit_api.models.account_user import AccountUser as AccountUserModel
from submit_api.models.user_role import UserRole as UserRoleModel
from submit_api.models.role import Role as RoleModel
from submit_api.utils.constants import MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE
from submit_api.models.account_project import AccountProject as AccountProjectModel
from submit_api.enums.role import RoleEnum
from submit_cron.models import db


class ResubmissionEmailService:
    """Handles sending email notifications for resubmission requests."""

    @classmethod
    def get_account_primary_admin_user(cls, package: PackageModel) -> AccountUserModel:
        """Get the ACCOUNT_PRIMARY_ADMIN user for the package's account."""
        # Get the account_id from the package's account_project using direct query
        account_project = (
            db.session.query(AccountProjectModel)
            .filter(AccountProjectModel.id == package.account_project_id)
            .first()
        )
        if not account_project:
            raise BadRequestError("Account project not found")

        # Get the ACCOUNT_PRIMARY_ADMIN role using direct query
        account_primary_admin_role = (
            db.session.query(RoleModel)
            .filter(RoleModel.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)
            .first()
        )
        if not account_primary_admin_role:
            raise BadRequestError("Account primary admin role not found")

        # Query for the account primary admin user directly using the same db instance as other services
        account_primary_admin_user = (
            db.session.query(AccountUserModel)
            .join(UserRoleModel, AccountUserModel.id == UserRoleModel.account_user_id)
            .filter(
                AccountUserModel.account_id == account_project.account_id,
                UserRoleModel.role_id == account_primary_admin_role.id,
                UserRoleModel.active
            )
            .first()
        )

        if not account_primary_admin_user:
            raise BadRequestError("No account primary admin found for this account")

        return account_primary_admin_user

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
