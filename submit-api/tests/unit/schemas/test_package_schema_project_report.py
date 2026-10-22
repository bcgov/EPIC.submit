"""Unit tests for project_report serialization on PackageSchema."""
from faker import Faker

from submit_api.schemas.package import PackageSchema
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_package_model,
    factory_project_model,
    factory_project_report_model,
    factory_report_package_model,
    factory_user_model,
    set_global_token_info,
)

fake = Faker()


def _setup_account_project(session):
    """Create an account project and return it."""
    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    session.flush()
    return project, account_project


def test_report_package_serializes_project_report(session):
    """A report-linked package dumps a populated project_report object."""
    # Status calculation in PackageSchema needs an authenticated user.
    set_global_token_info(TestJwtClaims.staff_admin_role)
    factory_user_model(auth_guid=TestJwtClaims.staff_admin_role["preferred_username"])

    project, account_project = _setup_account_project(session)
    project_report = factory_project_report_model(
        project_id=project.id,
        condition_number=7,
        condition_subsection="2",
        display_name="Annual Report",
        frequency="Annually",
        phase="Construction",
        timing="Within 30 days of the anniversary",
    )
    package = factory_report_package_model(account_project, project_report)

    dumped = PackageSchema().dump(package)

    assert dumped["project_report"] is not None
    assert dumped["project_report"]["condition_number"] == 7
    assert dumped["project_report"]["condition_subsection"] == "2"
    assert dumped["project_report"]["display_name"] == "Annual Report"
    assert dumped["project_report"]["frequency"] == "Annually"
    assert dumped["project_report"]["phase"] == "Construction"
    assert dumped["project_report"]["timing"] == "Within 30 days of the anniversary"


def test_non_report_package_has_null_project_report(session):
    """A package without a report obligation dumps project_report as null."""
    set_global_token_info(TestJwtClaims.staff_admin_role)
    factory_user_model(auth_guid=TestJwtClaims.staff_admin_role["preferred_username"])

    package = factory_package_model()

    dumped = PackageSchema().dump(package)

    assert dumped["project_report"] is None
