"""Database-backed tests for ProponentService."""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from faker import Faker
import pytest

from submit_api.enums.non_work_item import NonWorkItemType
from submit_api.enums.proponent_status import NonCanonicalProponentStatus, ProponentStatus
from submit_api.enums.role import RoleEnum
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import AccountProject, AccountProjectNonWork, AccountProjectWork, UserRole
from submit_api.services.proponent_service import ProponentService
from tests.utilities.factory_utils import (
    create_proponent_with_role, factory_account_model, factory_account_project_model, factory_invitation_model,
    factory_project_model, factory_proponent_model, factory_track_phase, factory_track_work)


fake = Faker()
SYNC = "submit_api.services.proponent_service.ReportPackageSyncService.reconcile_project"


@pytest.fixture()
def onboarded(session):
    """Return a dict describing an onboarded proponent with an account, project, work and admin user."""
    proponent_id = fake.random_int(100000, 999999)
    proponent = factory_proponent_model(id=proponent_id, name="Onboarded Corp", status=ProponentStatus.ONBOARDED)
    account = factory_account_model(proponent_id=proponent_id)
    project = factory_project_model(name="Eligible Project", proponent_id=proponent_id)
    project.has_approved_condition = True
    session.add(project)
    phase = factory_track_phase(session, display_name="Display Phase", enable_submit=True)
    work = factory_track_work(session, project.id, phase_id=phase.id, title="Eligible Work")
    user, account_user, _ = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=account.id, role_name=RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)
    session.flush()
    return {"proponent": proponent, "account": account, "project": project, "work": work, "phase": phase,
            "account_user": account_user}


def test_get_proponent_missing_returns_none(session):
    """Unknown proponents return None."""
    assert ProponentService.get_proponent(99999999) is None


def test_get_proponent_without_options(session, onboarded):
    """Without options the plain proponent dict is returned."""
    result = ProponentService.get_proponent(onboarded["proponent"].id)
    assert result["name"] == "Onboarded Corp"
    assert "projects" not in result


def test_get_proponent_with_all_options(session, onboarded):
    """All optional sections are included on request."""
    factory_invitation_model(onboarded["account"].id, project_ids=[onboarded["project"].id], token=fake.uuid4())
    with patch("submit_api.services.proponent_service.jwt.contains_role", return_value=True):
        result = ProponentService.get_proponent(
            onboarded["proponent"].id, include_invitations=True, include_projects=True,
            include_eligibility_entries=True, include_administrators=True)

    assert len(result["invitations"]) == 1
    assert "token" in result["invitations"][0]
    assert [p["id"] for p in result["projects"]] == [onboarded["project"].id]
    entries = result["eligibility_entries"]
    assert {e["non_work_item_type"] for e in entries} == {None, NonWorkItemType.MANAGEMENT_PLAN.value}
    work_entry = next(e for e in entries if e["work_id"])
    assert work_entry["current_phase"] == "Display Phase"
    assert work_entry["is_onboarded"] is False
    assert result["administrators"][0]["id"] == onboarded["account_user"].id


def test_eligibility_entries_flag_onboarded_items(session, onboarded):
    """Works and non-work items already on an account project are flagged as onboarded."""
    account_project = factory_account_project_model(onboarded["account"].id, onboarded["project"].id)
    AccountProjectWork.get_or_create(account_project.id, onboarded["work"].id)
    AccountProjectNonWork.get_or_create(account_project.id, NonWorkItemType.MANAGEMENT_PLAN)

    result = ProponentService.get_proponent(onboarded["proponent"].id, include_eligibility_entries=True)

    assert all(entry["is_onboarded"] for entry in result["eligibility_entries"])


def test_get_proponent_includes_projects_without_accounts(session):
    """A proponent without accounts still lists its projects."""
    proponent = factory_proponent_model(id=fake.random_int(100000, 999999), name="No Account Corp")
    factory_project_model(name="Lonely", proponent_id=proponent.id)
    result = ProponentService.get_proponent(
        proponent.id, include_invitations=True, include_projects=True, include_administrators=True)
    assert len(result["projects"]) == 1
    assert "invitations" not in result


def test_invitation_proponent_returns_selected_entries(session, onboarded):
    """Only the entries selected on the invitation are returned."""
    invitation = factory_invitation_model(
        onboarded["account"].id, project_ids=[onboarded["project"].id], token=fake.uuid4())
    invitation.eligible_entries = [{
        "project_id": onboarded["project"].id,
        "work_ids": [onboarded["work"].id],
        "non_work_item_types": [],
    }]
    session.flush()

    result = ProponentService.get_invitation_proponent(invitation.token)

    assert result["id"] == onboarded["proponent"].id
    assert [e["work_id"] for e in result["eligibility_entries"]] == [onboarded["work"].id]


def test_invitation_proponent_errors(session, onboarded):
    """Unknown or expired tokens are not found."""
    with pytest.raises(ResourceNotFoundError):
        ProponentService.get_invitation_proponent("no-such-token")

    expired = factory_invitation_model(
        onboarded["account"].id, project_ids=[onboarded["project"].id], token=fake.uuid4(),
        expiry_date=datetime.now(timezone.utc) - timedelta(days=1))
    with pytest.raises(ResourceNotFoundError):
        ProponentService.get_invitation_proponent(expired.token)


def test_invitation_proponent_missing_proponent(session, onboarded):
    """An invitation whose proponent was deleted is not found."""
    invitation = factory_invitation_model(
        onboarded["account"].id, project_ids=[onboarded["project"].id], token=fake.uuid4())
    onboarded["proponent"].is_deleted = True
    session.flush()
    with pytest.raises(ResourceNotFoundError):
        ProponentService.get_invitation_proponent(invitation.token)


def test_expired_invitation_changes_effective_status(session):
    """Proponents with only expired pending invitations are reported as INVITE_EXPIRED."""
    proponent = factory_proponent_model(
        id=fake.random_int(100000, 999999), name="Expired Corp", status=ProponentStatus.INVITE_GENERATED)
    account = factory_account_model(proponent_id=proponent.id)
    project = factory_project_model(name="P", proponent_id=proponent.id)
    factory_invitation_model(account.id, project_ids=[project.id], token=fake.uuid4(),
                             expiry_date=datetime.now(timezone.utc) - timedelta(days=1))

    single = ProponentService.get_proponent(proponent.id)
    listed = [p for p in ProponentService.get_all_proponents() if p["id"] == proponent.id]

    assert single["status"] == NonCanonicalProponentStatus.INVITE_EXPIRED.value
    assert listed[0]["status"] == NonCanonicalProponentStatus.INVITE_EXPIRED.value


def test_get_all_proponents_filters(session, onboarded):
    """Deleted proponents and non-approved-condition proponents can be filtered."""
    deleted = factory_proponent_model(id=fake.random_int(100000, 999999), name="Gone", is_deleted=True)
    ids = [p["id"] for p in ProponentService.get_all_proponents()]
    assert deleted.id not in ids
    assert deleted.id in [p["id"] for p in ProponentService.get_all_proponents(include_deleted=True)]
    approved = [p["id"] for p in ProponentService.get_all_proponents(approved_conditions_only=True)]
    assert onboarded["proponent"].id in approved
    assert deleted.id not in approved


def test_parse_eligibility_entries(session):
    """Entry ids are split into project ids and work or non-work selections."""
    projects, works, non_works = ProponentService._parse_eligibility_entries(
        ["1:work:5", "1:non_work:MANAGEMENT_PLAN", "2:non_work:BOGUS", "bad-entry"])
    assert projects == {1, 2}
    assert works == {1: [5]}
    assert non_works == {1: [NonWorkItemType.MANAGEMENT_PLAN]}


def test_add_eligible_account_projects(session, onboarded):
    """Enabling projects creates account projects, admin roles, and work associations."""
    project, work = onboarded["project"], onboarded["work"]
    entries = [f"{project.id}:work:{work.id}", f"{project.id}:non_work:MANAGEMENT_PLAN"]

    with patch(SYNC) as sync:
        ProponentService.add_eligible_account_projects(onboarded["proponent"].id, {"eligibility_entry_ids": entries})

    account_project = AccountProject.query.filter_by(
        account_id=onboarded["account"].id, project_id=project.id).first()
    assert account_project is not None
    assert AccountProjectWork.find_by_account_project_id(account_project.id)[0].work_id == work.id
    assert AccountProjectNonWork.find_by_account_project_id(account_project.id)
    assert UserRole.query.filter_by(
        account_user_id=onboarded["account_user"].id, account_project_id=account_project.id).count() == 1
    sync.assert_called_once_with(project.id)

    # idempotent: second call does not duplicate the role
    with patch(SYNC):
        ProponentService.add_eligible_account_projects(onboarded["proponent"].id, {"eligibility_entry_ids": entries})
    assert UserRole.query.filter_by(
        account_user_id=onboarded["account_user"].id, account_project_id=account_project.id).count() == 1


def test_add_eligible_account_projects_legacy_projects(session, onboarded):
    """Legacy project ids attach every work of the project."""
    with patch(SYNC):
        ProponentService.add_eligible_account_projects(
            onboarded["proponent"].id, {"projects": [onboarded["project"].id]})
    account_project = AccountProject.query.filter_by(
        account_id=onboarded["account"].id, project_id=onboarded["project"].id).first()
    assert [w.work_id for w in AccountProjectWork.find_by_account_project_id(account_project.id)] == [
        onboarded["work"].id]


def test_add_eligible_account_projects_validation(session):
    """Unknown or not-yet-onboarded proponents are rejected."""
    with pytest.raises(ResourceNotFoundError):
        ProponentService.add_eligible_account_projects(99999999, {})
    pending = factory_proponent_model(id=fake.random_int(100000, 999999), name="Pending",
                                      status=ProponentStatus.PENDING_ONBOARDING)
    with pytest.raises(BadRequestError):
        ProponentService.add_eligible_account_projects(pending.id, {})


def test_report_sync_failures_do_not_break_onboarding(session):
    """A failure while syncing report packages is logged and swallowed."""
    with patch(SYNC, side_effect=[RuntimeError("condition api down"), None]) as sync:
        ProponentService._sync_report_packages_for_projects([1, 2])
    assert sync.call_count == 2


def test_administrators_skip_non_admins(session, onboarded):
    """Only active primary admins are listed."""
    onboarded["account_user"].roles[0].active = False
    session.flush()
    assert ProponentService._get_administrators([onboarded["account"].id]) == []
