from flask import current_app
from sqlalchemy import or_

from submit_api.data_classes.email_details import EmailDetails
from submit_api.enums.role import RoleEnum
from submit_api.exceptions import BadRequestError
from submit_api.models.account_project import AccountProject as AccountProjectModel
from submit_api.models.account_user import AccountUser as AccountUserModel
from submit_api.models.package import Package as PackageModel
from submit_api.models.role import Role as RoleModel
from submit_api.models.user_role import UserRole as UserRoleModel
from submit_api.utils.constants import MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE

from submit_cron.models import db


class ResubmissionEmailService:
    """Handles sending email notifications for resubmission requests."""

    @classmethod
    def get_resubmission_recipient_users(cls, package: PackageModel) -> list[AccountUserModel]:
        """Get RP account admins and project admins for the package."""
        account_project_id = package.account_project_id
        account_project = db.session.get(AccountProjectModel, account_project_id)
        if not account_project:
            raise BadRequestError(f"Account project with ID {account_project_id} not found")

        current_app.logger.info(
            f"Looking for resubmission email recipients for account_project_id: {account_project_id}"
        )

        admin_roles = [
            RoleEnum.ACCOUNT_PRIMARY_ADMIN.value,
            RoleEnum.PROJECT_ADMIN.value,
        ]
        recipient_users = (
            db.session.query(AccountUserModel)
            .join(UserRoleModel, AccountUserModel.id == UserRoleModel.account_user_id)
            .join(RoleModel, UserRoleModel.role_id == RoleModel.id)
            .filter(
                AccountUserModel.account_id == account_project.account_id,
                UserRoleModel.active,
                RoleModel.role_name.in_(admin_roles),
                # RP admins are account-wide; project admins must match this package's project.
                or_(
                    RoleModel.role_name == RoleEnum.ACCOUNT_PRIMARY_ADMIN.value,
                    UserRoleModel.account_project_id == account_project_id,
                ),
            )
            .all()
        )

        current_app.logger.info(
            f"Found {len(recipient_users)} resubmission recipients for account_project_id: {account_project_id}"
        )

        if not recipient_users:
            current_app.logger.warning(f"No resubmission recipients found for account_project_id: {account_project_id}")
            raise BadRequestError("No resubmission recipients found for this account project")

        email_addresses = [user.work_email_address for user in recipient_users]
        current_app.logger.info(f"Resubmission recipient email addresses: {email_addresses}")

        return recipient_users

    @classmethod
    def prepare_resubmission_request_email(
        cls,
        package: PackageModel,
        recipient_users: list[AccountUserModel],
    ) -> EmailDetails:
        """Prepare email details for resubmission request recipients."""
        if not package.submitted_by_user or not package.submitted_by_user.account_user:
            raise BadRequestError(f"Submitter with auth_guid {package.submitted_by} not found")
        web_url = current_app.config.get('WEB_URL')
        submission_link = f"{web_url}/proponent/projects/{package.account_project_id}/submission-packages/{package.id}"
        recipient_emails = [user.work_email_address for user in recipient_users]

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
