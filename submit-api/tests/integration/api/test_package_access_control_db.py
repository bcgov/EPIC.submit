"""Database-backed tests for PackageAccessControl decision logic."""
from unittest.mock import patch

from faker import Faker
import pytest
from werkzeug.exceptions import HTTPException

from submit_api.enums.package_operation import PackageOperation
from submit_api.enums.role import RoleEnum
from submit_api.models import AccountProjectWork, PackageType, StaffUser, StaffUserWork
from submit_api.models.user import UserType
from submit_api.services.package_access_control import PackageAccessControl
from submit_api.utils.roles import EpicSubmitRole
from tests.utilities.factory_utils import (
    create_proponent_with_role, factory_account_model, factory_account_project_model, factory_package_model,
    factory_project_model, factory_track_phase, factory_track_work, factory_user_model)


fake = Faker()
MODULE = "submit_api.services.package_access_control"


def _as(user_guid, roles):
    """Patch the token username and role checks for the duration of a test."""
    granted = set(roles)
    return (
        patch(f"{MODULE}.TokenInfo.get_username", return_value=user_guid),
        patch(f"{MODULE}.jwt.contains_role", side_effect=lambda required: any(r in granted for r in required)),
    )


class _Ctx:
    """Context manager applying both patches."""

    def __init__(self, user_guid, roles):
        self.patches = _as(user_guid, roles)

    def __enter__(self):
        for p in self.patches:
            p.start()

    def __exit__(self, *exc):
        for p in self.patches:
            p.stop()


@pytest.fixture()
def staff(session):
    """Return a persisted staff user."""
    user = factory_user_model(auth_guid=f"{fake.user_name()}@idir", session=session)
    staff_user = StaffUser.create_staff_user(
        {"first_name": "S", "last_name": "U", "work_email_address": fake.email(), "user_id": user.id})
    session.flush()
    return staff_user


def test_validation_failures_without_abort(session, staff):
    """Missing id, package, or user simply return False when not aborting."""
    package = factory_package_model()
    with _Ctx(staff.user.auth_guid, []):
        assert PackageAccessControl.check_package_access(None, PackageOperation.READ, abort_on_failure=False) is False
        assert PackageAccessControl.check_package_access(99999999, PackageOperation.READ, False) is False
    with _Ctx("ghost@idir", []):
        assert PackageAccessControl.check_package_access(package.id, PackageOperation.READ, False) is False


def test_validation_failures_abort(session, staff):
    """Validation failures abort with the matching HTTP status."""
    package = factory_package_model()
    with _Ctx(staff.user.auth_guid, []):
        for package_id, status in ((None, 400), (99999999, 404)):
            with pytest.raises(HTTPException) as exc:
                PackageAccessControl.check_package_access(package_id, PackageOperation.READ)
            assert exc.value.code == status
    with _Ctx("ghost@idir", []):
        with pytest.raises(HTTPException) as exc:
            PackageAccessControl.check_package_access(package.id, PackageOperation.READ)
        assert exc.value.code == 401
        with pytest.raises(HTTPException) as exc:
            PackageAccessControl.check_package_type_access("Management Plan", PackageOperation.READ)
        assert exc.value.code == 401
        assert not PackageAccessControl.check_package_type_access("X", PackageOperation.READ, abort_on_failure=False)


def test_full_access_staff_bypasses_checks(session, staff):
    """FULL_ACCESS staff can do anything."""
    package = factory_package_model()
    with _Ctx(staff.user.auth_guid, [EpicSubmitRole.FULL_ACCESS.value]):
        assert PackageAccessControl.check_package_access(package.id, PackageOperation.APPROVE) is True
        assert PackageAccessControl.check_package_type_access("Anything", PackageOperation.APPROVE) is True


def test_management_plan_role_operations(session, staff):
    """Each MP role only grants its own operation."""
    package = factory_package_model()  # type 1 is Management Plan
    cases = {
        EpicSubmitRole.MP_VIEW.value: PackageOperation.READ,
        EpicSubmitRole.MP_EDIT.value: PackageOperation.EDIT,
        EpicSubmitRole.MP_CREATE.value: PackageOperation.CREATE,
        EpicSubmitRole.MP_EXTENDED_EDIT.value: PackageOperation.APPROVE,
    }
    for role, allowed in cases.items():
        with _Ctx(staff.user.auth_guid, [role]):
            for operation in PackageOperation:
                result = PackageAccessControl.check_package_access(package.id, operation, abort_on_failure=False)
                assert result is (operation == allowed)
                type_result = PackageAccessControl.check_package_type_access(
                    "Management Plan", operation, abort_on_failure=False)
                assert type_result is (operation == allowed)


def test_denied_access_aborts_with_forbidden(session, staff):
    """Insufficient roles abort with 403."""
    package = factory_package_model()
    with _Ctx(staff.user.auth_guid, [EpicSubmitRole.MP_VIEW.value]):
        with pytest.raises(HTTPException) as exc:
            PackageAccessControl.check_package_access(package.id, PackageOperation.EDIT)
        assert exc.value.code == 403
        with pytest.raises(HTTPException) as exc:
            PackageAccessControl.check_package_type_access("Management Plan", PackageOperation.EDIT)
        assert exc.value.code == 403


def test_non_mp_package_uses_eao_roles(session, staff):
    """Other package types fall back to the EAO roles."""
    other_type = PackageType(name=f"Other {fake.uuid4()}", title="Other")
    session.add(other_type)
    session.flush()
    package = factory_package_model(package_type_id=other_type.id)
    cases = {
        EpicSubmitRole.EAO_VIEW.value: PackageOperation.READ,
        EpicSubmitRole.EAO_EDIT.value: PackageOperation.EDIT,
        EpicSubmitRole.EAO_CREATE.value: PackageOperation.CREATE,
    }
    for role, allowed in cases.items():
        with _Ctx(staff.user.auth_guid, [role]):
            for operation in PackageOperation:
                assert PackageAccessControl.check_package_access(
                    package.id, operation, abort_on_failure=False) is (operation == allowed)
                assert PackageAccessControl.check_package_type_access(
                    "Other", operation, abort_on_failure=False) is (operation == allowed)


def test_get_user_package_permissions(session, staff):
    """The permission list reflects every allowed operation."""
    package = factory_package_model()
    with _Ctx(staff.user.auth_guid, [EpicSubmitRole.MP_VIEW.value, EpicSubmitRole.MP_EDIT.value]):
        permissions = PackageAccessControl.get_user_package_permissions(package.id)
    assert permissions == [PackageOperation.READ, PackageOperation.EDIT]


def _work_package(session):
    """Create a package attached to an account project work."""
    phase = factory_track_phase(session)
    account = factory_account_model(proponent_id=fake.random_int(100000, 999999))
    project = factory_project_model(name=fake.uuid4(), proponent_id=account.proponent_id)
    account_project = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project.id, phase_id=phase.id)
    apw = AccountProjectWork.get_or_create(account_project.id, work.id)
    package = factory_package_model(account_project=account_project)
    package.account_project_work_id = apw.id
    session.flush()
    return package, apw, work


def test_work_package_requires_assignment_and_role(session, staff):
    """Work packages need an active assignment plus the matching W_* role."""
    package, apw, work = _work_package(session)
    guid = staff.user.auth_guid

    with _Ctx(guid, [EpicSubmitRole.W_VIEW.value]):
        # no assignment yet
        assert PackageAccessControl.check_package_access(package.id, PackageOperation.READ, False) is False

    StaffUserWork.get_or_create(staff.id, work.id)
    with _Ctx(guid, [EpicSubmitRole.W_VIEW.value]):
        assert PackageAccessControl.check_package_access(package.id, PackageOperation.READ, False) is True
        assert PackageAccessControl.check_package_access(package.id, PackageOperation.EDIT, False) is False
        assert PackageAccessControl.check_package_type_access(
            "Whatever", PackageOperation.READ, account_project_work_id=apw.id, abort_on_failure=False) is True


def test_work_package_gis_extended_edit_bypasses_assignment(session, staff):
    """GIS extended edit skips the assignment check."""
    package, _, _ = _work_package(session)
    with _Ctx(staff.user.auth_guid, [EpicSubmitRole.GIS_EXTENDED_EDIT.value]):
        assert PackageAccessControl.check_package_access(package.id, PackageOperation.READ, False) is True


def test_work_package_unknown_work_or_non_staff(session, staff):
    """Unknown work ids and non-staff users have no work package access."""
    _, apw, _ = _work_package(session)
    with _Ctx(staff.user.auth_guid, [EpicSubmitRole.W_VIEW.value]):
        assert PackageAccessControl._has_work_package_permission(99999999, PackageOperation.READ, staff.user) is False

    proponent_guid = fake.uuid4()
    account = factory_account_model(proponent_id=fake.random_int(100000, 999999))
    user, _, _ = create_proponent_with_role(session, auth_guid=proponent_guid, account_id=account.id)
    session.flush()
    with _Ctx(proponent_guid, [EpicSubmitRole.W_VIEW.value]):
        assert PackageAccessControl._has_work_package_permission(apw.id, PackageOperation.READ, user) is False


def test_proponent_create_permission(session):
    """Proponents may create packages only where they hold a project role with the permission."""
    guid = fake.uuid4()
    account = factory_account_model(proponent_id=fake.random_int(100000, 999999))
    project = factory_project_model(name=fake.uuid4(), proponent_id=account.proponent_id)
    account_project = factory_account_project_model(account.id, project.id)
    other = factory_project_model(name=fake.uuid4(), proponent_id=account.proponent_id)
    other_project = factory_account_project_model(account.id, other.id)
    user, _, _ = create_proponent_with_role(
        session, auth_guid=guid, account_id=account.id, role_name=RoleEnum.PROJECT_ADMIN.value,
        account_project_id=account_project.id)
    session.flush()
    own_package = factory_package_model(account_project=account_project)
    other_package = factory_package_model(account_project=other_project)

    with _Ctx(guid, []):
        assert PackageAccessControl.check_package_access(own_package.id, PackageOperation.CREATE, False) is True
        assert PackageAccessControl.check_package_access(other_package.id, PackageOperation.CREATE, False) is False

    stranger = factory_user_model(auth_guid=fake.uuid4(), user_type=UserType.PROPONENT, session=session)
    with _Ctx(stranger.auth_guid, []):
        assert PackageAccessControl._has_proponent_create_permission(own_package) is False
