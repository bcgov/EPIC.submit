"""Tests for archiving a work's out-of-phase packages."""
from contextlib import contextmanager
from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from sqlalchemy.exc import SQLAlchemyError

from submit_api.enums.package_type import FINISHED_PACKAGE_STATUS_NAMES, PackageApprovalType
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import AccountProjectWork, Package, PackageType, UpdateRequest
from submit_api.models.package import PackageStatus
from submit_api.models.update_request import UpdateRequestStatus
from submit_api.services.invitation_service import InvitationService
from submit_api.services.work_phase_sync_service import WorkPhaseSyncError, WorkPhaseSyncService
from tests.utilities.factory_utils import (
    factory_account_model, factory_account_project_model, factory_package_model, factory_project_model,
    factory_track_phase, factory_track_work, factory_user_model)


class Scenario:
    """A work with an account project, a start/end phase pair and a later phase."""

    def __init__(self, session, current_phase="next"):
        """Create the phases, project, account and work, placing the work in the given phase."""
        self.session = session
        self.start_phase = factory_track_phase(session)
        self.end_phase = factory_track_phase(session)
        self.next_phase = factory_track_phase(session)
        self.project = factory_project_model()
        self.account = factory_account_model()
        self.account_project = factory_account_project_model(self.account.id, self.project.id)
        phase = {"next": self.next_phase, "start": self.start_phase, "end": self.end_phase, None: None}[current_phase]
        self.work = factory_track_work(session, self.project.id, phase_id=phase.id if phase else None)
        self.account_project_work = AccountProjectWork.get_or_create(
            self.account_project.id, self.work.id, session)
        self._type_count = 0

    def package_type(self, approval_type=None, mandatory=False, with_phases=True):
        """Create a package type bound (or not) to the scenario's start/end phase."""
        self._type_count += 1
        package_type = PackageType(
            name=f"Archive type {self.work.id}-{self._type_count}", title="Archive type",
            start_phase_id=self.start_phase.id if with_phases else None,
            end_phase_id=self.end_phase.id if with_phases else None,
            approval_type=approval_type, mandatory=mandatory)
        self.session.add(package_type)
        self.session.flush()
        return package_type

    def package(self, package_type, status, linked_to_work=True, **kwargs):
        """Create a package of the type, linked to the work, with the given status names."""
        package = factory_package_model(
            account_project=self.account_project, package_type_id=package_type.id,
            status=[PackageStatus[name].value for name in status], **kwargs)
        if linked_to_work:
            package.account_project_work_id = self.account_project_work.id
            self.session.add(package)
            self.session.commit()
        return package


def _archived(package):
    """Reload the package and return its archived_on."""
    return Package.find_by_id(package.id).archived_on


@pytest.mark.parametrize("status", sorted(FINISHED_PACKAGE_STATUS_NAMES))
def test_finished_out_of_phase_package_is_archived(session, status):
    """Every end status archives an out-of-phase package."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.B), [status])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 1
    assert _archived(package) is not None


@pytest.mark.parametrize("current_phase", ["start", "end"])
def test_package_in_phase_range_is_not_archived(session, current_phase):
    """A package is kept while the work is in the start or the end phase."""
    scenario = Scenario(session, current_phase=current_phase)
    package = scenario.package(scenario.package_type(PackageApprovalType.A), ["APPROVED"])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert _archived(package) is None


def test_acknowledged_package_awaiting_approval_is_not_archived(session):
    """A Type C package that is acknowledged but ready for approval is not finished."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.C), ["ACKNOWLEDGED", "READY_FOR_APPROVAL"])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert _archived(package) is None


def _update_request(session, package, status, active=True):
    """Create an update request on the package."""
    user = factory_user_model()
    request = UpdateRequest(
        submission_package_id=package.id, submission_item_types=[1], created_by=user.auth_guid,
        status=status, active=active)
    session.add(request)
    session.commit()
    return request


@pytest.mark.parametrize("status", [UpdateRequestStatus.OPEN.value, UpdateRequestStatus.PENDING_REVIEW.value])
def test_finished_package_with_open_update_request_is_kept(session, status):
    """A finished package waits while an update request is still open."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])
    _update_request(session, package, status)

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert _archived(package) is None


def test_finished_package_with_closed_update_request_is_archived(session):
    """An accepted or inactive update request does not hold the package back."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])
    _update_request(session, package, UpdateRequestStatus.ACCEPTED.value, active=False)

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 1


def test_unfinished_non_mandatory_type_a_package_is_archived_immediately(session):
    """A non-mandatory type A package is archived even though it is not finished."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.A, mandatory=False), ["IN_PROGRESS"])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 1
    assert _archived(package) is not None


@pytest.mark.parametrize("approval_type, mandatory", [
    (PackageApprovalType.A, True),
    (PackageApprovalType.B, False),
    (PackageApprovalType.C, False),
    (None, False),
])
def test_other_unfinished_packages_stay_available(session, approval_type, mandatory):
    """Unfinished packages that are not non-mandatory type A stay so the proponent can submit them."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(approval_type, mandatory=mandatory), ["IN_PROGRESS"])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert _archived(package) is None


def test_phase_less_package_type_is_never_archived(session):
    """Package types without a phase range (for example Management Plan) are not archived."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.A, with_phases=False), ["APPROVED"])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert _archived(package) is None


def test_package_without_work_is_never_archived(session):
    """Packages that are not linked to a work are left alone."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.A), ["APPROVED"], linked_to_work=False)

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert _archived(package) is None


def test_already_archived_package_keeps_its_archived_on(session):
    """An archived package is not touched or counted again."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])
    archived_on = datetime(2026, 1, 1, tzinfo=timezone.utc)
    package.archived_on = archived_on
    session.add(package)
    session.commit()

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert _archived(package).replace(tzinfo=timezone.utc) == archived_on


def test_second_run_archives_nothing_more(session):
    """The archive is idempotent."""
    scenario = Scenario(session)
    scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 1
    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0


def test_work_without_current_phase_or_unknown_work_archives_nothing(session):
    """A work with no current phase, or an unknown work, is skipped."""
    scenario = Scenario(session, current_phase=None)
    scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0
    assert WorkPhaseSyncService.archive_out_of_phase_packages(-1) == 0


def test_all_versions_are_archived_together_once_the_latest_is_finished(session):
    """Versions of one package are archived as a group, judged by the latest version."""
    scenario = Scenario(session)
    package_type = scenario.package_type(PackageApprovalType.C)
    first = scenario.package(package_type, ["NOT_APPROVED"])
    second = scenario.package(package_type, ["REVISION_REQUIRED"], original_package_id=first.id, version=2)

    # The newest version is still in progress, so the older NOT_APPROVED version must not archive the lineage.
    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 0

    second.status = [PackageStatus.APPROVED.value]
    session.add(second)
    session.commit()

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 2
    assert _archived(first) is not None
    assert _archived(second) is not None


def test_failed_archive_leaves_packages_unarchived_and_the_next_run_completes(session):
    """If the archive transaction fails nothing is archived, and a later run archives the packages."""
    scenario = Scenario(session)
    package = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])

    @contextmanager
    def failing_scope():
        raise RuntimeError("database went away")
        yield  # pragma: no cover

    with patch("submit_api.services.work_phase_sync_service.session_scope", failing_scope):
        with pytest.raises(RuntimeError):
            WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id)
    assert _archived(package) is None

    assert WorkPhaseSyncService.archive_out_of_phase_packages(scenario.work.id) == 1
    assert _archived(package) is not None


class TestReconcileWork:
    """reconcile_work archives the old area and creates the mandatory packages of the new phase."""

    @staticmethod
    def _mandatory_type(scenario, name=None, end_phase=None):
        """Create a mandatory package type that starts in the scenario's next phase."""
        scenario._type_count += 1
        package_type = PackageType(
            name=name or f"Mandatory type {scenario.work.id}-{scenario._type_count}", title="Mandatory",
            start_phase_id=scenario.next_phase.id,
            end_phase_id=(end_phase or factory_track_phase(scenario.session)).id,
            mandatory=True, approval_type=PackageApprovalType.B)
        scenario.session.add(package_type)
        scenario.session.flush()
        return package_type

    @staticmethod
    def _packages_of_type(scenario, package_type):
        """Return the work's packages of the given package type."""
        return Package.query.filter_by(
            account_project_work_id=scenario.account_project_work.id, type_id=package_type.id).all()

    def test_archives_old_packages_and_creates_new_mandatory_package(self, session):
        """After the phase moves, the finished package is archived and the new mandatory one is created."""
        scenario = Scenario(session)
        old = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])
        mandatory = self._mandatory_type(scenario)

        summary = WorkPhaseSyncService.reconcile_work(scenario.work.id)

        assert summary == {"work_id": scenario.work.id, "archived": 1, "created": 1, "skipped": False}
        assert _archived(old) is not None
        created = self._packages_of_type(scenario, mandatory)
        assert len(created) == 1
        assert created[0].archived_on is None

    def test_second_run_changes_nothing(self, session):
        """Running the reconcile again does not archive or create anything."""
        scenario = Scenario(session)
        scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])
        mandatory = self._mandatory_type(scenario)
        WorkPhaseSyncService.reconcile_work(scenario.work.id)

        summary = WorkPhaseSyncService.reconcile_work(scenario.work.id)

        assert summary["archived"] == 0 and summary["created"] == 0
        assert len(self._packages_of_type(scenario, mandatory)) == 1

    def test_creates_the_exact_package_type_when_names_are_shared(self, session):
        """Two package types with one name but different phase ranges: the one for the phase is created."""
        scenario = Scenario(session)
        mandatory = self._mandatory_type(scenario, name="Shared name")
        other = PackageType(
            name="Shared name", title="Other", start_phase_id=scenario.start_phase.id,
            end_phase_id=scenario.end_phase.id, mandatory=False)
        session.add(other)
        session.flush()

        WorkPhaseSyncService.reconcile_work(scenario.work.id)

        assert len(self._packages_of_type(scenario, mandatory)) == 1
        assert self._packages_of_type(scenario, other) == []

    def test_failure_after_archive_keeps_the_archive_and_next_run_creates_the_package(self, session):
        """If creation fails, the archive stays, the error is raised, and the next run creates the package."""
        scenario = Scenario(session)
        old = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])
        mandatory = self._mandatory_type(scenario)

        with patch.object(WorkPhaseSyncService, "_create_mandatory_packages", side_effect=SQLAlchemyError("boom")):
            with pytest.raises(WorkPhaseSyncError):
                WorkPhaseSyncService.reconcile_work(scenario.work.id)
        assert _archived(old) is not None
        assert self._packages_of_type(scenario, mandatory) == []

        summary = WorkPhaseSyncService.reconcile_work(scenario.work.id)

        assert summary["archived"] == 0 and summary["created"] == 1
        assert len(self._packages_of_type(scenario, mandatory)) == 1

    def test_archive_failure_does_not_stop_package_creation_and_next_run_archives(self, session):
        """A failed archive still lets the mandatory package be created, and the next run archives."""
        scenario = Scenario(session)
        old = scenario.package(scenario.package_type(PackageApprovalType.B), ["ACKNOWLEDGED"])
        mandatory = self._mandatory_type(scenario)

        with patch.object(WorkPhaseSyncService, "archive_out_of_phase_packages", side_effect=SQLAlchemyError("boom")):
            with pytest.raises(WorkPhaseSyncError):
                WorkPhaseSyncService.reconcile_work(scenario.work.id)
        assert _archived(old) is None
        assert len(self._packages_of_type(scenario, mandatory)) == 1

        summary = WorkPhaseSyncService.reconcile_work(scenario.work.id)

        assert summary["archived"] == 1 and summary["created"] == 0
        assert _archived(old) is not None

    def test_failure_on_second_mandatory_package_is_completed_by_the_next_run(self, session):
        """When creating the second of two packages fails, the first is kept and only the second is created."""
        scenario = Scenario(session)
        first = self._mandatory_type(scenario)
        second = self._mandatory_type(scenario)
        original = InvitationService._create_mandatory_package
        calls = []

        def create_then_fail(account_project, account_project_work, package_type):
            calls.append(package_type.id)
            if len(calls) == 2:
                raise SQLAlchemyError("boom")
            return original(account_project, account_project_work, package_type)

        with patch.object(InvitationService, "_create_mandatory_package", side_effect=create_then_fail):
            with pytest.raises(WorkPhaseSyncError):
                WorkPhaseSyncService.reconcile_work(scenario.work.id)
        created_first_run = [t for t in (first, second) if self._packages_of_type(scenario, t)]
        assert len(created_first_run) == 1

        summary = WorkPhaseSyncService.reconcile_work(scenario.work.id)

        assert summary["created"] == 1
        assert len(self._packages_of_type(scenario, first)) == 1
        assert len(self._packages_of_type(scenario, second)) == 1

    def test_run_is_skipped_while_another_run_holds_the_work_lock(self, session):
        """A second run for a locked work does nothing, and runs normally once the lock is released."""
        scenario = Scenario(session)
        mandatory = self._mandatory_type(scenario)

        with WorkPhaseSyncService._work_lock(scenario.work.id) as acquired:
            assert acquired is True
            summary = WorkPhaseSyncService.reconcile_work(scenario.work.id)
            assert summary["skipped"] is True and summary["created"] == 0
        assert self._packages_of_type(scenario, mandatory) == []

        assert WorkPhaseSyncService.reconcile_work(scenario.work.id)["created"] == 1

    def test_unknown_work_raises_not_found(self, session):
        """Reconciling a work that does not exist is a not-found error."""
        with pytest.raises(ResourceNotFoundError):
            WorkPhaseSyncService.reconcile_work(-1)
