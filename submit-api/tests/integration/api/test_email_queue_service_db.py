"""Database-backed tests for SubmitEmailQueueService payload building and queueing."""
from datetime import datetime
from unittest.mock import patch

from faker import Faker
import pytest

from submit_api.enums.role import RoleEnum
from submit_api.exceptions import BadRequestError
from submit_api.models import AccountUser, Role, User, UserRole
from submit_api.services.email_queue_service import SubmitEmailQueueService as Service
from submit_api.services.auth_service import AuthService
from submit_api.utils.constants import (
    GIS_SUBMISSION_NOTIFY_EMAIL_TEMPLATE, MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE,
    MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE, MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE,
    MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE, SUBMISSION_ACKNOWLEDGED_CONFIRMATION_EMAIL_TEMPLATE,
    SUBMISSION_AWAITING_MANAGER_APPROVAL_EMAIL_TEMPLATE, SUBMISSION_WITHDRAWN_CONFIRMATION_EMAIL_TEMPLATE)
from tests.utilities.factory_utils import (
    factory_document_submission_model, factory_invitation_model, factory_item_model, factory_package_model,
    factory_project_report_model, factory_report_package_model, setup_authenticated_proponent)


fake = Faker()
CONFIG = {
    "SENDER_EMAIL": "sender@example.com",
    "STAFF_SUPPORT_MAIL_ID": "staff@example.com",
    "GIS_SUPPORT_MAIL_ID": "gis@example.com",
    "BASE_APP_URL": "https://submit.example.com/",
}


@pytest.fixture()
def submitted(session, app, jwt):
    """Return (package, submitter account user) for a submitted package with one document."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    account_user = AccountUser.query.filter_by(account_id=account_project.account_id).first()
    auth_guid = User.query.get(account_user.user_id).auth_guid
    package = factory_package_model(account_project=account_project, name="Plan A")
    package.submitted_by = auth_guid
    package.submitted_on = datetime(2026, 1, 15, 18, 30)
    session.add(package)
    item = factory_item_model(package=package)
    factory_document_submission_model(item, created_by=auth_guid, name="plan.pdf")
    session.flush()
    with patch.dict(app.config, CONFIG):
        yield package, account_user


def test_queue_package_email_for_each_template(session, submitted):
    """Every supported package template produces a queued email with a sender and recipient."""
    package, account_user = submitted
    templates = [
        MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE,
        MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE,
        MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE,
        MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE,
        SUBMISSION_ACKNOWLEDGED_CONFIRMATION_EMAIL_TEMPLATE,
    ]
    for template in templates:
        email = Service.queue_package_email(package.id, template, session=session)
        assert email.template_name == template
        assert email.payload["sender"]
        assert email.payload["recipients"]

    confirmation = Service.queue_package_email(
        package.id, MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE, session=session)
    assert confirmation.payload["recipients"] == [account_user.work_email_address]
    assert confirmation.payload["body_args"]["documents"] == ["plan.pdf"]
    assert "Jan" not in confirmation.payload["body_args"]["submission_date"]
    assert confirmation.payload["body_args"]["submission_date"].startswith("2026-01-15")


def test_queue_package_email_withdrawn(session, submitted):
    """The withdrawn email goes to the current account user."""
    package, account_user = submitted
    with patch.object(Service, "_get_current_account_user", return_value=account_user):
        email = Service.queue_package_email(
            package.id, SUBMISSION_WITHDRAWN_CONFIRMATION_EMAIL_TEMPLATE, session=session)
    assert email.payload["recipients"] == [account_user.work_email_address]
    assert email.payload["body_args"]["submission_link"].startswith("https://submit.example.com/proponent/projects/")


def test_queue_package_email_withdrawn_without_user_has_no_recipient(session, submitted):
    """Without a recipient the payload is rejected."""
    package, _ = submitted
    with patch.object(Service, "_get_current_account_user", return_value=None):
        with pytest.raises(BadRequestError):
            Service.queue_package_email(package.id, SUBMISSION_WITHDRAWN_CONFIRMATION_EMAIL_TEMPLATE, session=session)


def test_queue_awaiting_manager_approval_email(session, submitted):
    """Manager emails come from the auth service group lookup."""
    package, _ = submitted
    with patch.object(AuthService, "get_group_members", return_value=["boss@example.com"]):
        email = Service.queue_package_email(
            package.id, SUBMISSION_AWAITING_MANAGER_APPROVAL_EMAIL_TEMPLATE, session=session)
    assert email.payload["recipients"] == ["boss@example.com"]
    assert email.payload["body_args"]["team_member_name"] == "a team member"


def test_queue_gis_email_lists_gis_files(session, submitted):
    """GIS emails name the geospatial documents."""
    package, _ = submitted
    with patch.object(Service, "_get_gis_document_names", return_value=["shape.zip"]):
        email = Service.queue_package_email(package.id, GIS_SUBMISSION_NOTIFY_EMAIL_TEMPLATE, session=session)
    assert email.payload["recipients"] == ["gis@example.com"]
    assert email.payload["body_args"]["gis_file_names"] == ["shape.zip"]


def test_queue_package_email_errors(session, submitted):
    """Unknown packages and templates are rejected."""
    package, _ = submitted
    with pytest.raises(BadRequestError):
        Service.queue_package_email(99999999, MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE, session=session)
    with pytest.raises(BadRequestError):
        Service.queue_package_email(package.id, "nope.html", session=session)


def test_queue_package_submission_emails(session, submitted, app):
    """Submission queues the confirmation, staff notice, and GIS notice when configured."""
    package, _ = submitted
    with patch.object(Service, "_get_gis_document_names", return_value=["shape.zip"]):
        emails = Service.queue_package_submission_emails(package, session=session)
    assert [e.template_name for e in emails] == [
        MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE,
        MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE,
        GIS_SUBMISSION_NOTIFY_EMAIL_TEMPLATE,
    ]


def test_queue_package_submission_emails_without_gis_recipient(session, submitted, app):
    """A missing GIS recipient is logged and the GIS email skipped."""
    package, _ = submitted
    with patch.dict(app.config, {"GIS_SUPPORT_MAIL_ID": None}), \
            patch.object(Service, "_get_gis_document_names", return_value=["shape.zip"]):
        emails = Service.queue_package_submission_emails(package, session=session)
    assert len(emails) == 2


def test_queue_invitation_email(session, submitted):
    """Invitation emails link to the sign-up page with the token."""
    package, _ = submitted
    account_project = package.account_project_id
    from submit_api.models import AccountProject

    ap = AccountProject.query.get(account_project)
    invitation = factory_invitation_model(
        account_id=ap.account_id, project_ids=[ap.project_id], token="tok123", email="new@example.com")
    email = Service.queue_invitation_email(invitation.id, session=session)
    assert email.payload["recipients"] == ["new@example.com"]
    assert email.payload["body_args"]["invitation_url"].endswith("?token=tok123")

    with pytest.raises(BadRequestError):
        Service.queue_invitation_email(99999999, session=session)


def test_invitation_project_resolution(session, submitted):
    """The invitation's project comes from project ids, package ids, or fails."""
    from types import SimpleNamespace

    package, _ = submitted
    from submit_api.models import AccountProject

    ap = AccountProject.query.get(package.account_project_id)
    by_package = SimpleNamespace(id=1, project_ids=None, package_ids=[package.id])
    assert Service._get_project_for_invitation(by_package).id == ap.project_id

    neither = SimpleNamespace(id=2, project_ids=None, package_ids=None)
    with pytest.raises(BadRequestError):
        Service._get_project_for_invitation(neither)

    missing = SimpleNamespace(id=3, project_ids=[99999999], package_ids=None)
    with pytest.raises(BadRequestError):
        Service._get_project_for_invitation(missing)

    unknown_package = SimpleNamespace(id=4, project_ids=None, package_ids=[99999999])
    with pytest.raises(BadRequestError):
        Service._get_project_for_invitation(unknown_package)


def test_resubmission_recipients_include_admins(session, submitted):
    """Account admins and matching project admins receive resubmission requests."""
    package, account_user = submitted
    role = Role.get_by_name(RoleEnum.PROJECT_ADMIN.value)
    session.add(UserRole(account_user_id=account_user.id, role_id=role.id,
                         account_project_id=package.account_project_id))
    session.flush()
    assert account_user.work_email_address in Service._get_resubmission_recipient_emails(package)


def test_report_acknowledgement_email(session, submitted):
    """Report acknowledgement emails name the report and the acknowledged document."""
    package, account_user = submitted
    from submit_api.models import AccountProject

    ap = AccountProject.query.get(package.account_project_id)
    report = factory_project_report_model(
        ap.project_id, report_type="Compliance Self-Report", phase="Construction", display_name="CSR")
    report_package = factory_report_package_model(ap, report)
    report_package.submitted_by = package.submitted_by
    report_package.submitted_on = package.submitted_on
    item = factory_item_model(package=report_package)
    submission = factory_document_submission_model(item, created_by=package.submitted_by, name="csr.pdf")

    email = Service.queue_report_acknowledgement_email(submission, session=session)

    assert email.payload["subject"] == "Submission acknowledged - Compliance Self-Report: Construction"
    assert email.payload["body_args"]["documents"] == ["csr.pdf"]
    assert email.payload["body_args"]["posted_on_epic"] is True


def test_report_submission_name_fallbacks(session, submitted):
    """Submission names fall back through display name, type and package name."""
    package, _ = submitted
    from types import SimpleNamespace

    def named(report):
        return Service._report_submission_name(SimpleNamespace(project_report=report, name="Pkg"))

    assert named(None) == "Pkg"
    assert named(SimpleNamespace(phase=None, report_type="Annual", display_name="Disp")) == "Disp"
    assert named(SimpleNamespace(phase=None, report_type="Annual", display_name=None)) == "Annual"
    assert named(SimpleNamespace(phase="P", report_type="Annual", display_name=None)) == "Annual: P"


def test_report_acknowledgement_requires_package(session):
    """A submission whose package cannot be found is rejected."""
    from types import SimpleNamespace

    submission = SimpleNamespace(item=SimpleNamespace(package_id=99999999))
    with pytest.raises(BadRequestError):
        Service.queue_report_acknowledgement_email(submission, session=session)


def test_helper_validation_and_formatting(session, app):
    """Payload and formatting helpers validate their inputs."""
    with pytest.raises(BadRequestError):
        Service._payload("", ["a@b.c"], "s", {})
    with pytest.raises(BadRequestError):
        Service._payload("a@b.c", [], "s", {})
    with pytest.raises(BadRequestError):
        Service._payload("a@b.c", ["a@b.c"], "", {})
    assert Service._as_recipients(None) == []
    assert Service._format_submission_date(None) == ""
    with pytest.raises(BadRequestError):
        Service._get_account_project(99999999)
    with patch.dict(app.config, {"BASE_APP_URL": None, "WEB_URL": None, "SITE_URL": None}):
        assert Service._get_base_url() == ""


def test_sender_email_fallback_and_failure(session, app):
    """Sender lookup falls back to config and fails when nothing is configured."""
    from types import SimpleNamespace

    package = SimpleNamespace(type=SimpleNamespace(name="Other"))
    with patch.dict(app.config, {"SENDER_EMAIL": "x@example.com"}):
        assert Service._get_sender_email(package) == "x@example.com"
    with patch.dict(app.config, {"SENDER_EMAIL": None}):
        with pytest.raises(BadRequestError):
            Service._get_sender_email(package)
