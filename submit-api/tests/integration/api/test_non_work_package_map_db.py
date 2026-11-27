"""Tests for database-driven non-work package maps (Management Plan, Report).

Covers eligibility, the Documents table Work/Phase labels and filter keys, and the
Submission Type filter's package types.
"""
from faker import Faker

from submit_api.enums.non_work_item import NonWorkItemType
from submit_api.models.account_project_search_options import ProjectDocumentSearchOptions
from submit_api.models.account_project_work import AccountProjectWork
from submit_api.models.non_work_package_map import NonWorkPackageMap
from submit_api.models.queries.submitted_document import DocumentQueries, parse_work_phase_keys
from submit_api.models.submission import SubmissionStatus
from submit_api.services.non_work_package_map_service import NonWorkPackageMapService
from submit_api.services.package_type_service import PackageTypeService
from tests.utilities.factory_utils import (
    factory_account_model, factory_account_project_model, factory_document_submission_model, factory_item_model,
    factory_package_model, factory_project_report_model, factory_project_with_proponent, factory_report_package_model,
    factory_track_phase, factory_track_work, factory_user_model)


fake = Faker()

MP_WORK_LABEL = "Management Plan & Related Documents"
REPORT_WORK_LABEL = "Reports & Recurring Submissions"
POST_DECISION = "Post Decision"


def _project(session, has_approved_condition=True):
    """Create a project with an account project."""
    project = factory_project_with_proponent(has_approved_condition=has_approved_condition)
    account = factory_account_model(proponent_id=project.proponent_id)
    account_project = factory_account_project_model(account.id, project.id)
    session.flush()
    return project, account_project


def _document(session, package, name=None):
    """Attach a submitted (latest-version) document to the package.

    The listing hides PENDING submissions, which is the model default, so mark it SUBMITTED.
    """
    user = factory_user_model(auth_guid=fake.uuid4())
    item = factory_item_model(package=package)
    submission = factory_document_submission_model(
        item, created_by=user.auth_guid, name=name, status=SubmissionStatus.SUBMITTED)
    submission.root_submission_id = submission.id
    session.flush()
    return submission


def _work_package(session, project, account_project, title="EA Work", phase_name="Effects Assessment",
                  phase_display_name=None):
    """Create a package tied to a work in the given phase."""
    phase = factory_track_phase(session, name=phase_name, display_name=phase_display_name)
    work = factory_track_work(session, project.id, phase_id=phase.id, title=title)
    apw = AccountProjectWork(account_project_id=account_project.id, work_id=work.id, is_active=True)
    session.add(apw)
    session.flush()
    package = factory_package_model(account_project=account_project)
    package.account_project_work_id = apw.id
    session.flush()
    return package, work


def _list(project, work_phase=None):
    """Return the paginated document rows for a project."""
    options = ProjectDocumentSearchOptions(
        page=1, size=50, project_id=project.id, work_phase=work_phase, is_staff=True)
    return DocumentQueries.get_documents_paginated(options).items


def test_seeded_non_work_package_maps(session):
    """The migration seeds Management Plan and Report with their labels; only Management Plan is onboardable."""
    management_plan = NonWorkPackageMap.find_by_code(NonWorkItemType.MANAGEMENT_PLAN.value)
    report = NonWorkPackageMap.find_by_code(NonWorkItemType.REPORT.value)

    assert (management_plan.work_label, management_plan.phase_label) == (MP_WORK_LABEL, POST_DECISION)
    assert (report.work_label, report.phase_label) == (REPORT_WORK_LABEL, POST_DECISION)
    assert management_plan.is_onboarding_option is True
    assert report.is_onboarding_option is False


def test_eligibility_follows_approved_condition(session):
    """Both types need approved conditions; onboarding only offers Management Plan."""
    approved, _ = _project(session, has_approved_condition=True)
    not_approved, _ = _project(session, has_approved_condition=False)

    codes = [c.code for c in NonWorkPackageMapService.get_eligible_for_project(approved)]
    onboarding_codes = [
        c.code for c in NonWorkPackageMapService.get_eligible_for_project(approved, onboarding_only=True)
    ]

    assert codes == ["MANAGEMENT_PLAN", "REPORT"]
    assert onboarding_codes == ["MANAGEMENT_PLAN"]
    assert NonWorkPackageMapService.get_eligible_for_project(not_approved) == []
    assert NonWorkPackageMapService.is_eligible(approved, NonWorkItemType.REPORT) is True
    assert NonWorkPackageMapService.is_eligible(approved, NonWorkItemType.REPORT, onboarding_only=True) is False


def test_work_document_keeps_work_labels_in_approved_project(session):
    """A document under a work shows the work, even when the project has approved conditions."""
    project, account_project = _project(session, has_approved_condition=True)
    package, _ = _work_package(session, project, account_project, title="EA Work",
                               phase_name="Effects Assessment", phase_display_name="Effects Assessment Phase")
    _document(session, package)

    rows = _list(project)

    assert [(r.work, r.phase) for r in rows] == [("EA Work", "Effects Assessment Phase")]


def test_management_plan_and_report_documents_use_their_own_labels(session):
    """Management Plan and Report documents each show under their own bucket."""
    project, account_project = _project(session, has_approved_condition=True)
    _document(session, factory_package_model(account_project=account_project), name="plan.pdf")
    report_package = factory_report_package_model(account_project, factory_project_report_model(project.id))
    _document(session, report_package, name="report.pdf")

    labels = {r.name: (r.work, r.phase) for r in _list(project)}

    assert labels["plan.pdf"] == (MP_WORK_LABEL, POST_DECISION)
    assert labels["report.pdf"] == (REPORT_WORK_LABEL, POST_DECISION)


def test_work_phase_filter_keys(session):
    """Filter keys select works and each non-work bucket separately."""
    project, account_project = _project(session, has_approved_condition=True)
    work_package, work = _work_package(session, project, account_project, title="Title - with dash")
    _document(session, work_package, name="work.pdf")
    _document(session, factory_package_model(account_project=account_project), name="plan.pdf")
    report_package = factory_report_package_model(account_project, factory_project_report_model(project.id))
    _document(session, report_package, name="report.pdf")

    def names(keys):
        return sorted(r.name for r in _list(project, work_phase=keys))

    assert names([f"work:{work.id}"]) == ["work.pdf"]
    assert names(["non_work:MANAGEMENT_PLAN"]) == ["plan.pdf"]
    assert names(["non_work:REPORT"]) == ["report.pdf"]
    assert names([f"work:{work.id}", "non_work:REPORT"]) == ["report.pdf", "work.pdf"]
    assert names(["Management Plan & Related Documents - Post Decision"]) == []


def test_parse_work_phase_keys_ignores_invalid_values():
    """Malformed keys are dropped."""
    work_ids, codes = parse_work_phase_keys(
        ["work:12", "work:abc", "non_work:MANAGEMENT_PLAN", "non_work:", "junk", None])

    assert work_ids == [12]
    assert codes == ["MANAGEMENT_PLAN"]


def test_package_types_by_project_include_eligible_non_work_package_maps(session):
    """The Submission Type filter offers Management Plan, IEM and Report for approved-condition projects."""
    project, _ = _project(session, has_approved_condition=True)

    names = {pt.name for pt in PackageTypeService.get_by_project_id(project.id)}

    assert {"Management Plan", "Report"} <= names


def test_package_types_by_project_exclude_non_work_package_maps_when_ineligible(session):
    """Projects without approved conditions get no phase-less types."""
    project, _ = _project(session, has_approved_condition=False)

    names = {pt.name for pt in PackageTypeService.get_by_project_id(project.id)}

    assert "Management Plan" not in names
    assert "Report" not in names
