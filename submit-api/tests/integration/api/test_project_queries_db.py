"""Database-backed tests for ProjectQueries visibility, search and pagination."""
from unittest.mock import patch

from faker import Faker
import pytest

from submit_api.enums.role import RoleEnum
from submit_api.models import AccountProjectWork, PackageType, StaffUser, StaffUserWork
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.package import NonCanonicalPackageStatus, PackageStatus
from submit_api.models.queries.account_project import ProjectQueries
from submit_api.models.user import UserType
from submit_api.utils.roles import EpicSubmitRole
from tests.utilities.factory_utils import (
    create_proponent_with_role, factory_account_model, factory_account_project_model, factory_package_model,
    factory_project_model, factory_track_phase, factory_track_work, factory_user_model)


fake = Faker()
MODULE = "submit_api.models.queries.account_project"


def _roles(*roles):
    """Patch jwt.contains_role to grant only the given roles."""
    granted = {r.value if hasattr(r, "value") else r for r in roles}
    return patch(f"{MODULE}.jwt.contains_role", side_effect=lambda required: any(r in granted for r in required))


def _staff(session):
    """Create a staff user with a staff profile."""
    user = factory_user_model(auth_guid=f"{fake.user_name()}@idir", session=session)
    staff_user = StaffUser.create_staff_user(
        {"first_name": "S", "last_name": "U", "work_email_address": fake.email(), "user_id": user.id})
    session.flush()
    return user, staff_user


@pytest.fixture()
def world(session):
    """Create an account project with a work package, a management plan package and an empty project."""
    account = factory_account_model(proponent_id=fake.random_int(100000, 999999))
    project = factory_project_model(name=f"Alpha {fake.uuid4()}", proponent_id=account.proponent_id)
    account_project = factory_account_project_model(account.id, project.id)
    empty_project = factory_project_model(name=f"Empty {fake.uuid4()}", proponent_id=account.proponent_id)
    empty_account_project = factory_account_project_model(account.id, empty_project.id)

    phase = factory_track_phase(session)
    work = factory_track_work(session, project.id, phase_id=phase.id)
    apw = AccountProjectWork.get_or_create(account_project.id, work.id)

    work_type = PackageType(name=f"Work {fake.uuid4()}", title="Work")
    session.add(work_type)
    session.flush()
    mp_package = factory_package_model(account_project=account_project, name="MP Package")
    work_package = factory_package_model(
        account_project=account_project, name="Work Package", package_type_id=work_type.id)
    work_package.account_project_work_id = apw.id
    session.flush()
    return {
        "account": account, "project": project, "account_project": account_project, "work": work,
        "empty_account_project": empty_account_project, "mp_package": mp_package, "work_package": work_package,
    }


def _package_names(result, account_project_id):
    """Return package names for a project in a result list."""
    project = next(p for p in result if p["id"] == account_project_id)
    return {p["name"] for p in project["packages"]}


def test_full_access_staff_sees_everything(session, world):
    """FULL_ACCESS staff see all packages."""
    user, _ = _staff(session)
    with _roles(EpicSubmitRole.FULL_ACCESS):
        result, total = ProjectQueries.get_filtered_account_projects_paginated(
            None, page=1, page_size=100, is_proponent=False, user=user)
    assert total >= 2
    assert _package_names(result, world["account_project"].id) == {"MP Package", "Work Package"}


def test_mp_view_staff_sees_management_plans_only(session, world):
    """mp_view staff only see management plan packages."""
    user, _ = _staff(session)
    with _roles(EpicSubmitRole.MP_VIEW):
        result, _ = ProjectQueries.get_filtered_account_projects_paginated(
            None, page=1, page_size=100, is_proponent=False, user=user)
    assert _package_names(result, world["account_project"].id) == {"MP Package"}
    # projects without packages stay visible to staff
    assert world["empty_account_project"].id in [p["id"] for p in result]


def test_w_view_staff_sees_assigned_work_packages(session, world):
    """w_view staff see work packages for works they are assigned to."""
    user, staff_user = _staff(session)
    StaffUserWork.get_or_create(staff_user.id, world["work"].id)
    with _roles(EpicSubmitRole.W_VIEW):
        result, _ = ProjectQueries.get_filtered_account_projects_paginated(
            None, page=1, page_size=100, is_proponent=False, user=user)
        accessible = ProjectQueries._get_accessible_work_ids_for_staff_user(user)
    assert _package_names(result, world["account_project"].id) == {"Work Package"}
    assert accessible == [world["work"].id]


def test_w_view_staff_without_assignment_sees_no_work_packages(session, world):
    """Unassigned w_view staff do not see work packages."""
    user, _ = _staff(session)
    with _roles(EpicSubmitRole.W_VIEW):
        result, _ = ProjectQueries.get_filtered_account_projects_paginated(
            None, page=1, page_size=100, is_proponent=False, user=user)
    assert world["account_project"].id not in [p["id"] for p in result if p["packages"]]


def test_gis_extended_edit_staff_sees_all_work_packages(session, world):
    """GIS extended edit staff see every work package."""
    user, _ = _staff(session)
    with _roles(EpicSubmitRole.GIS_EXTENDED_EDIT):
        result, _ = ProjectQueries.get_filtered_account_projects_paginated(
            None, page=1, page_size=100, is_proponent=False, user=user)
    assert _package_names(result, world["account_project"].id) == {"Work Package"}


def test_staff_without_profile_sees_nothing(session, world):
    """Staff users without a staff profile get no packages."""
    user = factory_user_model(auth_guid=f"{fake.user_name()}@idir", session=session)
    session.flush()
    with _roles():
        assert ProjectQueries._filter_packages_by_user_access([{"packages": []}], user) == []
        assert ProjectQueries._get_accessible_work_ids_for_staff_user(user) == []


def test_accessible_work_ids_edge_cases(session):
    """Non-staff users and users without w_view have no accessible works."""
    proponent = factory_user_model(auth_guid=fake.uuid4(), user_type=UserType.PROPONENT, session=session)
    assert ProjectQueries._get_accessible_work_ids_for_staff_user(None) == []
    assert ProjectQueries._get_accessible_work_ids_for_staff_user(proponent) == []
    user, _ = _staff(session)
    with _roles():
        assert ProjectQueries._get_accessible_work_ids_for_staff_user(user) == []


def test_unknown_user_is_rejected(session):
    """A missing user raises."""
    with patch(f"{MODULE}.TokenInfo.get_username", return_value="ghost@idir"):
        with pytest.raises(ValueError):
            ProjectQueries._filter_packages_by_user_access([])


def test_proponent_admin_sees_project_packages(session, world):
    """Project admins see every package of their accessible projects, with pagination and search."""
    user, _, _ = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=world["account"].id, role_name=RoleEnum.PROJECT_ADMIN.value,
        account_project_id=world["account_project"].id)
    session.flush()
    options = AccountProjectSearchOptions(search_text="MP Package", status=None, submitted_on_start=None,
                                          submitted_on_end=None)

    paged, total = ProjectQueries.get_filtered_account_projects_paginated(
        options, page=1, page_size=10, is_proponent=True, user=user)
    unpaged, _ = ProjectQueries.get_filtered_account_projects_paginated(
        None, is_proponent=True, user=user)

    assert total == 1
    assert [p["id"] for p in paged] == [world["account_project"].id]
    assert [p["id"] for p in unpaged] == [world["account_project"].id]
    assert _package_names(unpaged, world["account_project"].id) == {"MP Package", "Work Package"}


def test_proponent_status_filter_recomputes_total(session, world):
    """Status filtering works on the calculated package status."""
    user, _, _ = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=world["account"].id, role_name=RoleEnum.PROJECT_ADMIN.value,
        account_project_id=world["account_project"].id)
    session.flush()
    options = AccountProjectSearchOptions(
        search_text=None, status=[PackageStatus.NEW], submitted_on_start=None, submitted_on_end=None)
    other = AccountProjectSearchOptions(
        search_text=None, status=[NonCanonicalPackageStatus.INVITE_EXPIRED] if hasattr(
            NonCanonicalPackageStatus, "INVITE_EXPIRED") else [PackageStatus.SUBMITTED],
        submitted_on_start=None, submitted_on_end=None)

    matching, total = ProjectQueries.get_filtered_account_projects_paginated(options, is_proponent=True, user=user)
    none, none_total = ProjectQueries.get_filtered_account_projects_paginated(other, is_proponent=True, user=user)

    assert total == len(matching)
    assert none_total == len(none)


def test_proponent_date_filters(session, world):
    """Submission date filters narrow the results."""
    from datetime import datetime

    user, _, _ = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=world["account"].id, role_name=RoleEnum.PROJECT_ADMIN.value,
        account_project_id=world["account_project"].id)
    world["mp_package"].submitted_on = datetime(2026, 3, 1)
    session.flush()

    inside = AccountProjectSearchOptions(None, None, "2026-01-01", "2026-12-31")
    outside = AccountProjectSearchOptions(None, None, "2027-01-01", None)

    _, inside_total = ProjectQueries.get_filtered_account_projects_paginated(inside, is_proponent=True, user=user)
    _, outside_total = ProjectQueries.get_filtered_account_projects_paginated(outside, is_proponent=True, user=user)

    assert inside_total == 1
    assert outside_total == 0


def test_proponent_contributor_limited_to_original_packages(session, world):
    """Specific contributors only see the packages they were granted."""
    user, account_user, role = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=world["account"].id,
        role_name=RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value, account_project_id=world["account_project"].id)
    role.original_package_ids = [world["mp_package"].version.original_package_id]
    session.flush()

    result, _ = ProjectQueries.get_filtered_account_projects_paginated(None, is_proponent=True, user=user)
    assert _package_names(result, world["account_project"].id) == {"MP Package"}


def test_proponent_contributor_without_package_grants_sees_nothing(session, world):
    """Contributors without package grants see no projects."""
    user, _, _ = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=world["account"].id,
        role_name=RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value, account_project_id=world["account_project"].id)
    session.flush()
    result, _ = ProjectQueries.get_filtered_account_projects_paginated(None, is_proponent=True, user=user)
    assert result == []


def test_proponent_without_roles_or_projects_sees_nothing(session):
    """Proponents without roles or with only account-wide roles see nothing."""
    user = factory_user_model(auth_guid=fake.uuid4(), user_type=UserType.PROPONENT, session=session)
    session.flush()
    assert ProjectQueries._filter_packages_by_user_access([{"id": 1}], user) == []
    assert ProjectQueries.get_accessible_account_project_ids_for_user(user) == []

    account = factory_account_model(proponent_id=fake.random_int(100000, 999999))
    admin, account_user, role = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=account.id, role_name=RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)
    assert ProjectQueries.get_accessible_account_project_ids_for_user(admin) == []
    role.active = False
    session.flush()
    assert ProjectQueries.get_accessible_account_project_ids_for_user(admin) == []


def test_get_account_project_by_id_and_projects_by_proponent(session, world):
    """Single project lookups honour staff work visibility."""
    user, staff_user = _staff(session)
    StaffUserWork.get_or_create(staff_user.id, world["work"].id)
    with patch(f"{MODULE}.TokenInfo.get_username", return_value=user.auth_guid), _roles(EpicSubmitRole.W_VIEW):
        detail = ProjectQueries.get_account_project_by_id(world["account_project"].id, is_staff=True)
    assert {p["name"] for p in detail["packages"]} == {"Work Package"}
    assert [w["work_id"] for w in detail["account_project_works"]] == [world["work"].id]
    assert len(ProjectQueries.get_projects_by_proponent_id(world["account"].proponent_id)) == 2


def test_get_account_project_by_id_without_full_access_hides_unassigned_works(session, world):
    """Staff without assignments see no account project works."""
    user, _ = _staff(session)
    with patch(f"{MODULE}.TokenInfo.get_username", return_value=user.auth_guid), _roles(EpicSubmitRole.MP_VIEW):
        detail = ProjectQueries.get_account_project_by_id(world["account_project"].id, is_staff=True)
    assert detail["account_project_works"] == []


def test_computed_status_filter_without_statuses_returns_input(session):
    """No requested statuses leaves the projects untouched."""
    projects = [{"id": 1, "packages": []}]
    assert ProjectQueries._filter_packages_by_computed_status(projects, None) is projects
