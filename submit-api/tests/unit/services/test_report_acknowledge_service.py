"""Unit tests for SubmissionService.acknowledge_report_document.

Covers the second EAO staff step for Compliance Self-Report (Report_TypeB)
packages: acknowledging a verified main report flips that document to
ACKNOWLEDGED and queues the acknowledgement email, while supporting documents,
non-Report_TypeB packages, and non-verified documents are rejected.
"""
from unittest.mock import patch

import pytest
from faker import Faker

from submit_api.enums.package_type import PackageTypeEnum
from submit_api.exceptions import UnprocessableEntityError
from submit_api.models.package_type import PackageType
from submit_api.models.submission import SubmissionStatus
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_document_submission_model,
    factory_item_model,
    factory_project_model,
    factory_project_report_model,
    factory_report_package_model,
    factory_user_model,
    set_global_token_info,
)

fake = Faker()

EMAIL_TARGET = (
    "submit_api.services.submission.SubmitEmailQueueService."
    "queue_report_acknowledgement_email"
)


def _report_type_b_id():
    """Return the seeded Report_TypeB package type id."""
    package_type = PackageType.find_by_name(PackageTypeEnum.REPORT_TYPE_B.value)
    assert package_type is not None, "Report_TypeB package type must be seeded"
    return package_type.id


def _setup_compliance_report_package(session, report_type="Compliance Self-Report"):
    """Create a Report_TypeB package with one item and return (package, item, guid)."""
    set_global_token_info(TestJwtClaims.staff_admin_role)
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)

    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    project_report = factory_project_report_model(
        project_id=project.id,
        report_type=report_type,
        display_name=report_type,
        phase="Construction",
    )
    package = factory_report_package_model(
        account_project, project_report, package_type_id=_report_type_b_id()
    )
    item = factory_item_model(package=package, item_type_id=1, status="NEW",
                              submitted_by=auth_guid)
    session.flush()
    return package, item, auth_guid


def test_acknowledge_verified_main_report_sets_acknowledged_and_queues_email(session):
    """A verified main report becomes ACKNOWLEDGED and an email is queued."""
    from submit_api.services.submission import SubmissionService

    _package, item, auth_guid = _setup_compliance_report_package(session)
    submission = factory_document_submission_model(
        item, created_by=auth_guid, folder="reports"
    )
    submission.status = SubmissionStatus.VERIFIED
    session.add(submission)
    session.flush()

    with patch(EMAIL_TARGET) as mock_email:
        result = SubmissionService.acknowledge_report_document(submission.id)

    assert result.status == SubmissionStatus.ACKNOWLEDGED
    mock_email.assert_called_once()


def test_acknowledge_rejects_supporting_document(session):
    """A supporting document (not the main report) cannot be acknowledged."""
    from submit_api.services.submission import SubmissionService

    _package, item, auth_guid = _setup_compliance_report_package(session)
    submission = factory_document_submission_model(
        item, created_by=auth_guid, folder="report_supporting_documents"
    )
    submission.status = SubmissionStatus.VERIFIED
    session.add(submission)
    session.flush()

    # The validation rejects before any status change or email, and the
    # transaction rolls back (so the document stays VERIFIED in the DB).
    with patch(EMAIL_TARGET) as mock_email:
        with pytest.raises(UnprocessableEntityError):
            SubmissionService.acknowledge_report_document(submission.id)
    mock_email.assert_not_called()


def test_acknowledge_rejects_non_verified_document(session):
    """A main report that is not VERIFIED (still SUBMITTED) cannot be acknowledged."""
    from submit_api.services.submission import SubmissionService

    _package, item, auth_guid = _setup_compliance_report_package(session)
    submission = factory_document_submission_model(
        item, created_by=auth_guid, folder="reports"
    )
    submission.status = SubmissionStatus.SUBMITTED
    session.add(submission)
    session.flush()

    # The validation rejects before any status change or email, and the
    # transaction rolls back (so the document stays SUBMITTED in the DB).
    with patch(EMAIL_TARGET) as mock_email:
        with pytest.raises(UnprocessableEntityError):
            SubmissionService.acknowledge_report_document(submission.id)
    mock_email.assert_not_called()


def test_acknowledge_rejects_non_report_type_b_package(session):
    """A verified main report on a regular Report (type A) package is rejected."""
    from submit_api.services.submission import SubmissionService

    set_global_token_info(TestJwtClaims.staff_admin_role)
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)

    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    project_report = factory_project_report_model(project_id=project.id)
    # Default factory uses the regular 'Report' (type A) package type.
    package = factory_report_package_model(account_project, project_report)
    item = factory_item_model(package=package, item_type_id=1, status="NEW",
                              submitted_by=auth_guid)
    submission = factory_document_submission_model(
        item, created_by=auth_guid, folder="reports"
    )
    submission.status = SubmissionStatus.VERIFIED
    session.add(submission)
    session.flush()

    with patch(EMAIL_TARGET) as mock_email:
        with pytest.raises(UnprocessableEntityError):
            SubmissionService.acknowledge_report_document(submission.id)
    mock_email.assert_not_called()


def test_report_acknowledged_payload_for_compliance_self_report(session):
    """The acknowledgement email names the phase and flags posting on EPIC."""
    from types import SimpleNamespace

    from submit_api.services.email_queue_service import SubmitEmailQueueService

    package, item, auth_guid = _setup_compliance_report_package(session)
    submission = factory_document_submission_model(
        item, created_by=auth_guid, folder="reports", name="CSR_2026.pdf"
    )
    submission.status = SubmissionStatus.VERIFIED
    session.add(submission)
    session.flush()

    submitter = SimpleNamespace(full_name="Dana Whitfield", work_email_address="dana@corp.example")
    with patch.object(SubmitEmailQueueService, "_get_submitter", return_value=submitter):
        payload = SubmitEmailQueueService._build_report_acknowledged_payload(package, submission)

    assert payload["subject"] == "Submission acknowledged - Compliance Self-Report: Construction"
    assert payload["body_args"]["submission_name"] == "Compliance Self-Report: Construction"
    # Only the acknowledged main report is listed, not the whole package.
    assert payload["body_args"]["documents"] == ["CSR_2026.pdf"]
    assert payload["body_args"]["posted_on_epic"] is True
    assert payload["recipients"] == ["dana@corp.example"]


def test_report_acknowledged_payload_non_compliance_omits_epic_line(session):
    """A non-Compliance report acknowledgement does not set the posted-on-EPIC flag."""
    from types import SimpleNamespace

    from submit_api.services.email_queue_service import SubmitEmailQueueService

    package, item, auth_guid = _setup_compliance_report_package(
        session, report_type="Monitoring/Technical Report"
    )
    submission = factory_document_submission_model(
        item, created_by=auth_guid, folder="reports", name="Monitoring_2026.pdf"
    )
    submission.status = SubmissionStatus.VERIFIED
    session.add(submission)
    session.flush()

    submitter = SimpleNamespace(full_name="Dana Whitfield", work_email_address="dana@corp.example")
    with patch.object(SubmitEmailQueueService, "_get_submitter", return_value=submitter):
        payload = SubmitEmailQueueService._build_report_acknowledged_payload(package, submission)

    assert payload["body_args"]["posted_on_epic"] is False
    assert payload["body_args"]["submission_name"] == "Monitoring/Technical Report: Construction"
