"""Archive a work's out-of-phase packages when the work moves on, and create its new mandatory packages."""
from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone

from flask import current_app
from sqlalchemy import or_, text
from sqlalchemy.exc import SQLAlchemyError

from submit_api.enums.package_type import PackageApprovalType
from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models import AccountProjectWork, Package as PackageModel, PackageType as PackageTypeModel
from submit_api.models import TrackWork as TrackWorkModel
from submit_api.models.db import db, session_scope
from submit_api.models.update_request import UpdateRequestStatus
from submit_api.services.invitation_service import InvitationService

# An update request in one of these statuses means EAO is still working on the package.
OPEN_UPDATE_REQUEST_STATUSES = (UpdateRequestStatus.OPEN.value, UpdateRequestStatus.PENDING_REVIEW.value)

# Namespace for the per-work advisory lock, so it cannot clash with other advisory locks.
WORK_LOCK_NAMESPACE = 7301


class WorkPhaseSyncError(RuntimeError):
    """Raised after a reconcile finished its other steps but one step failed, so the caller retries."""


class WorkPhaseSyncService:
    """Archives packages whose work has moved past the package type's start/end phase range."""

    @classmethod
    def reconcile_work(cls, work_id: int) -> dict:
        """Archive the work's out-of-phase packages, then create the mandatory packages of its current phase.

        Both steps are idempotent and safe to repeat, so a run that fails part way is completed by the next
        run. The steps are independent: a failure in one does not stop the other, and the failure is raised
        at the end so the caller knows to retry. A per-work lock stops overlapping runs from creating the
        same mandatory package twice; a run that cannot get the lock does nothing and reports it as skipped.
        """
        work = TrackWorkModel.find_by_id(work_id)
        if not work:
            raise ResourceNotFoundError(f"Work {work_id} not found")

        with cls._work_lock(work_id) as acquired:
            if not acquired:
                current_app.logger.info(f"Work {work_id} is already being reconciled, skipping")
                return {"work_id": work_id, "archived": 0, "created": 0, "skipped": True}

            summary = {"work_id": work_id, "archived": 0, "created": 0, "skipped": False}
            errors = []
            try:
                summary["archived"] = cls.archive_out_of_phase_packages(work_id)
            except SQLAlchemyError as error:
                current_app.logger.error(f"Archiving packages failed for work {work_id}: {error}")
                errors.append(error)
            try:
                summary["created"] = cls._create_mandatory_packages(work_id)
            except (SQLAlchemyError, BadRequestError) as error:
                current_app.logger.error(f"Creating mandatory packages failed for work {work_id}: {error}")
                errors.append(error)

        if errors:
            raise WorkPhaseSyncError(f"Work {work_id} was only partly reconciled: {errors[0]}") from errors[0]
        return summary

    @staticmethod
    def _create_mandatory_packages(work_id: int) -> int:
        """Create the missing mandatory packages of the work's current phase; return how many were created."""
        created = 0
        for account_project_work in AccountProjectWork.find_by_work_id(work_id):
            created += InvitationService.ensure_mandatory_packages_for_work(
                account_project_work.account_project, account_project_work)
        return created

    @staticmethod
    @contextmanager
    def _work_lock(work_id: int):
        """Hold a non-blocking advisory lock for the work on its own connection; yield whether it was acquired.

        The lock lives on a dedicated connection because the steps commit their own transactions, which would
        release a transaction-level lock. It is released explicitly, or by the database if the process dies.
        """
        params = {"namespace": WORK_LOCK_NAMESPACE, "work_id": work_id}
        with db.engine.connect() as connection:
            acquired = bool(connection.execute(
                text("SELECT pg_try_advisory_lock(:namespace, :work_id)"), params).scalar())
            try:
                yield acquired
            finally:
                if acquired:
                    connection.execute(text("SELECT pg_advisory_unlock(:namespace, :work_id)"), params)

    @classmethod
    def archive_out_of_phase_packages(cls, work_id: int) -> int:
        """Archive the work's packages that are out of phase and ready to be archived.

        A package is out of phase when the work's current phase is neither the start nor the end phase of
        the package type. An out-of-phase package is archived when it is a non-mandatory type A package
        (archived right away), or when it is finished and has no open update request. Unfinished packages
        stay in place so they can still be submitted, and are archived by a later run once they finish.

        All packages are archived in one transaction, so the call either archives everything it selected
        or nothing, and is safe to repeat. Returns the number of packages archived.
        """
        work = TrackWorkModel.find_by_id(work_id)
        if not work or work.current_phase_id is None:
            return 0

        package_ids = cls._select_package_ids_to_archive(cls._find_out_of_phase_packages(work))
        if not package_ids:
            return 0

        with session_scope() as session:
            archived = session.query(PackageModel).filter(
                PackageModel.id.in_(package_ids), PackageModel.archived_on.is_(None)
            ).update({PackageModel.archived_on: datetime.now(timezone.utc)}, synchronize_session=False)
        current_app.logger.info(f"Archived {archived} out-of-phase package(s) for work {work_id}")
        return archived

    @staticmethod
    def _find_out_of_phase_packages(work: TrackWorkModel) -> list[PackageModel]:
        """Return the work's non-archived packages whose type has a phase range that excludes its current phase."""
        packages = (
            PackageModel.query
            .join(AccountProjectWork, PackageModel.account_project_work_id == AccountProjectWork.id)
            .join(PackageTypeModel, PackageModel.type_id == PackageTypeModel.id)
            .filter(
                AccountProjectWork.work_id == work.id,
                AccountProjectWork.is_active.is_(True),
                PackageModel.archived_on.is_(None),
                or_(PackageTypeModel.start_phase_id.isnot(None), PackageTypeModel.end_phase_id.isnot(None)),
            )
            .all()
        )
        return [package for package in packages if not package.type.matches_phase(work.current_phase_id)]

    @classmethod
    def _select_package_ids_to_archive(cls, packages: list[PackageModel]) -> list[int]:
        """Return the ids of every package version of each lineage whose latest version can be archived.

        Versions of one package are archived together. Only the latest version is judged, since an older
        version can be finished (for example not approved) while a newer one is still in progress.
        """
        lineages: dict = {}
        for package in packages:
            key = package.version.original_package_id if package.version else ('package', package.id)
            lineages.setdefault(key, []).append(package)

        package_ids: list[int] = []
        for versions in lineages.values():
            latest = max(versions, key=lambda version: version.version.version if version.version else 0)
            if cls._can_archive(latest):
                package_ids.extend(version.id for version in versions)
        return package_ids

    @staticmethod
    def _can_archive(package: PackageModel) -> bool:
        """Return True when an out-of-phase package is ready to be archived."""
        package_type = package.type
        if not package_type.mandatory and package_type.approval_type == PackageApprovalType.A:
            return True
        has_open_update_request = any(
            request.status in OPEN_UPDATE_REQUEST_STATUSES for request in package.update_requests
        )
        return package.is_finished and not has_open_update_request
