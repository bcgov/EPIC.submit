"""Unit tests for ReportPackageSyncService."""
from unittest.mock import patch

import pytest
from faker import Faker

from submit_api.enums.package_type import PackageTypeEnum
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models.package import Package, PackageStatus
from submit_api.models.package_type import PackageType
from submit_api.models.project_report import ProjectReport
from submit_api.models.submission import Submission, SubmissionType
from submit_api.services.report_package_sync_service import (
    ReportPackageSyncService,
    _compute_display_name,
    _flatten_reports,
    PROJECT_STATUS_NOTIFICATION,
)
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_project_with_proponent,
    factory_user_model,
)

fake = Faker()


def _reports_payload(
    submission_id=141,
    title="General Wildlife Habitat Features Report",
    frequency="One Time",
):
    """Return a Condition API style reports payload with one obligation.

    The stable obligation identity is the submission ``id``, not the report id.
    """
    return [{
        "id": 101,
        "condition_number": 21,
        "report_type": "Monitoring/Technical Report",
        "submissions": [{
            "id": submission_id,
            "condition_subsection": None,
            "frequency": frequency,
            "management_plan": None,
            "phase": "Construction",
            "report_submission_type": None,
            "report_title": title,
            "timing": "Within 30 days of completion",
        }],
    }]


def _setup_project(session):
    """Create a project with an account project and return (project, account_project)."""
    project = factory_project_with_proponent(epic_guid=fake.uuid4())
    account = factory_account_model(proponent_id=project.proponent_id)
    account_project = factory_account_project_model(account.id, project.id)
    session.flush()
    return project, account_project


# --------------------------------------------------------------------------- #
# display name + flatten
# --------------------------------------------------------------------------- #
def test_display_name_prefers_title():
    """Report title wins for the display name."""
    assert _compute_display_name("Title", "Monitoring Report", None) == "Title"


def test_display_name_uses_sub_type_for_status_notification():
    """A Project Status Notification without a title uses its sub-type."""
    name = _compute_display_name(None, PROJECT_STATUS_NOTIFICATION, "Primary Contact Notification")
    assert name == "Primary Contact Notification"


def test_flatten_skips_submissions_without_id(app):
    """Submissions with no id are skipped (the submission id is the key)."""
    reports = [{
        "id": 101,
        "condition_number": 1,
        "report_type": "X",
        "submissions": [{"phase": "A"}],
    }]
    assert _flatten_reports(reports) == []


def test_flatten_uses_submission_id_as_report_id(app):
    """The flattened record's report_id is the submission id, not the report id."""
    records = _flatten_reports(_reports_payload(submission_id=142))
    assert len(records) == 1
    assert records[0]["report_id"] == 142


# --------------------------------------------------------------------------- #
# reconcile: add + create package
# --------------------------------------------------------------------------- #
def test_reconcile_adds_obligation_and_creates_package(session):
    """A new obligation is inserted and an empty Report package is created, linked."""
    project, account_project = _setup_project(session)

    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=_reports_payload(),
    ):
        summary = ReportPackageSyncService.reconcile_project(project.id)

    assert summary["added"] == 1
    assert summary["created_packages"] == 1

    obligations = ProjectReport.get_by_project_id(project.id)
    assert len(obligations) == 1

    package = Package.get_by_project_report_id(obligations[0].id)
    assert package is not None
    assert package.account_project_id == account_project.id
    assert PackageStatus.NEW in package.status
    report_type = PackageType.find_by_name(PackageTypeEnum.REPORT.value)
    assert package.type_id == report_type.id


def test_reconcile_is_idempotent(session):
    """Running reconcile twice with identical data creates nothing new."""
    project, _ = _setup_project(session)

    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=_reports_payload(),
    ):
        ReportPackageSyncService.reconcile_project(project.id)
        summary = ReportPackageSyncService.reconcile_project(project.id)

    assert summary["added"] == 0
    assert summary["updated"] == 1
    assert summary["created_packages"] == 0
    assert len(ProjectReport.get_by_project_id(project.id)) == 1


def test_reconcile_updates_existing_obligation_in_place(session):
    """A changed field on an existing obligation (same submission id) is updated."""
    project, _ = _setup_project(session)

    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=_reports_payload(submission_id=141, frequency="Annually"),
    ):
        ReportPackageSyncService.reconcile_project(project.id)

    obligation = ProjectReport.get_by_project_id(project.id)[0]
    package_before = Package.get_by_project_report_id(obligation.id)
    assert obligation.frequency == "Annually"

    # Same submission id (141), changed frequency + title.
    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=_reports_payload(
            submission_id=141, title="Updated Report Name", frequency="Quarterly"
        ),
    ):
        summary = ReportPackageSyncService.reconcile_project(project.id)

    assert summary["updated"] == 1
    assert summary["added"] == 0
    assert summary["created_packages"] == 0

    obligations = ProjectReport.get_by_project_id(project.id)
    assert len(obligations) == 1
    updated = obligations[0]
    assert updated.frequency == "Quarterly"
    assert updated.report_name == "Updated Report Name"
    assert updated.display_name == "Updated Report Name"

    # The linked package is unchanged (same package, same id).
    package_after = Package.get_by_project_report_id(updated.id)
    assert package_after.id == package_before.id


# --------------------------------------------------------------------------- #
# reconcile: removal
# --------------------------------------------------------------------------- #
def test_reconcile_removes_vanished_pristine_obligation(session):
    """An obligation no longer returned with a pristine package is deleted."""
    project, _ = _setup_project(session)

    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=_reports_payload(),
    ):
        ReportPackageSyncService.reconcile_project(project.id)

    # Now the obligation disappears from the approved response.
    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=[],
    ):
        summary = ReportPackageSyncService.reconcile_project(project.id)

    assert summary["removed"] == 1
    assert summary["kept"] == 0
    assert ProjectReport.get_by_project_id(project.id) == []


def test_reconcile_keeps_vanished_obligation_with_documents(session):
    """An obligation no longer returned but whose package has a document is kept."""
    project, _ = _setup_project(session)

    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=_reports_payload(),
    ):
        ReportPackageSyncService.reconcile_project(project.id)

    obligation = ProjectReport.get_by_project_id(project.id)[0]
    package = Package.get_by_project_report_id(obligation.id)

    # Attach a DOCUMENT submission to the package's first item.
    user = factory_user_model(session=session)
    item = package.items[0]
    submission = Submission(
        item_id=item.id,
        type=SubmissionType.DOCUMENT,
        created_by=user.auth_guid,
        active=True,
        deleted=False,
    )
    session.add(submission)
    session.flush()
    # Expire cached instances so the reconcile re-reads the package's submissions.
    session.expire_all()

    with patch(
        "submit_api.services.report_package_sync_service.ConditionApiClient."
        "get_approved_reports_by_project",
        return_value=[],
    ):
        summary = ReportPackageSyncService.reconcile_project(project.id)

    assert summary["removed"] == 0
    assert summary["kept"] == 1
    assert len(ProjectReport.get_by_project_id(project.id)) == 1
    assert Package.get_by_project_report_id(obligation.id) is not None


# --------------------------------------------------------------------------- #
# reconcile: guard rails
# --------------------------------------------------------------------------- #
def test_reconcile_unknown_project_raises(session):
    """Reconciling an unknown project raises ResourceNotFoundError."""
    with pytest.raises(ResourceNotFoundError):
        ReportPackageSyncService.reconcile_project(999999)


def test_reconcile_project_without_account_project_raises(session):
    """A project with no account project cannot be synced."""
    project = factory_project_with_proponent(epic_guid=fake.uuid4())
    session.flush()
    with pytest.raises(ResourceNotFoundError):
        ReportPackageSyncService.reconcile_project(project.id)
