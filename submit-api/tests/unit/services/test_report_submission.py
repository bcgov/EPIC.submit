"""Unit tests for report obligation submission validation."""
import pytest
from faker import Faker

from submit_api.exceptions import BadRequestError
from submit_api.services.package_service import PackageService
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_document_submission_model,
    factory_item_model,
    factory_project_report_model,
    factory_project_model,
    factory_report_package_model,
    factory_user_model,
    set_global_token_info,
)

fake = Faker()


def _setup_report_package(session):
    """Create a report package with its single item and return (package, item, guid)."""
    set_global_token_info(TestJwtClaims.staff_admin_role)
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)

    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    project_report = factory_project_report_model(project_id=project.id)
    package = factory_report_package_model(account_project, project_report)
    item = factory_item_model(package=package, item_type_id=1, status="NEW",
                              submitted_by=auth_guid)
    session.flush()
    return package, item, auth_guid


def test_report_submission_requires_primary_document(session):
    """Submitting a report with only a supporting document is rejected."""
    package, item, auth_guid = _setup_report_package(session)
    factory_document_submission_model(
        item, created_by=auth_guid, folder="report_supporting_documents"
    )
    session.flush()

    with pytest.raises(BadRequestError) as exc:
        PackageService._validate_report_submission(package)
    assert "Please upload a document." in str(exc.value)


def test_report_submission_rejected_with_no_documents(session):
    """Submitting a report with no documents is rejected."""
    package, _item, _auth_guid = _setup_report_package(session)
    session.flush()

    with pytest.raises(BadRequestError):
        PackageService._validate_report_submission(package)


def test_report_submission_passes_with_primary_document(session):
    """A report with a primary ('reports' folder) document passes validation."""
    package, item, auth_guid = _setup_report_package(session)
    factory_document_submission_model(item, created_by=auth_guid, folder="reports")
    session.flush()

    # Should not raise.
    PackageService._validate_report_submission(package)
