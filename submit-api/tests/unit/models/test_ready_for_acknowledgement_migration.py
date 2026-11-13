"""Tests for the READY_FOR_ACKNOWLEDGEMENT status backfill migration."""
import importlib.util
from pathlib import Path

from submit_api.enums.package_type import PackageApprovalType
from submit_api.models.db import db
from submit_api.models.package import Package, PackageStatus
from submit_api.models.package_type import PackageType
from tests.utilities.factory_utils import factory_package_model

MIGRATION_FILE = (
    Path(__file__).resolve().parents[3]
    / 'migrations' / 'versions' / 'b9c8d7e6f5a4_ready_for_acknowledgement_status.py'
)


def _load_migration():
    """Import the migration module directly from its file."""
    spec = importlib.util.spec_from_file_location('ready_for_ack_migration', MIGRATION_FILE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _status_values(package_id):
    """Return the stored status values of a package as plain strings."""
    db.session.expire_all()
    package = db.session.get(Package, package_id)
    return sorted(s.value if hasattr(s, 'value') else s for s in package.status)


def _make_package_type(name, approval_type):
    """Create a package type with the given approval type."""
    package_type = PackageType(name=name, approval_type=approval_type, versioning_enabled=False, mandatory=False)
    db.session.add(package_type)
    db.session.flush()
    return package_type


def _run_backfill():
    """Run the migration's upgrade helpers on the test connection."""
    migration = _load_migration()
    conn = db.session.connection()
    ids = migration._packages_matching(conn, ['VERIFIED', 'PENDING_ACKNOWLEDGEMENT'], ['B', 'C'])
    migration._rewrite(conn, ids, ('VERIFIED', 'PENDING_ACKNOWLEDGEMENT'), 'READY_FOR_ACKNOWLEDGEMENT')
    db.session.flush()


def test_backfill_collapses_verified_pair_for_type_c(session):
    """A type C package with VERIFIED + PENDING_ACKNOWLEDGEMENT becomes READY_FOR_ACKNOWLEDGEMENT."""
    type_c = _make_package_type('Type C test package', PackageApprovalType.C)
    package = factory_package_model(
        package_type_id=type_c.id,
        status=[PackageStatus.VERIFIED.value, PackageStatus.PENDING_ACKNOWLEDGEMENT.value],
    )

    _run_backfill()

    assert _status_values(package.id) == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]


def test_backfill_leaves_type_a_packages_untouched(session):
    """Type A packages keep VERIFIED as their terminal status."""
    type_a = _make_package_type('Type A test package', PackageApprovalType.A)
    package = factory_package_model(
        package_type_id=type_a.id,
        status=[PackageStatus.VERIFIED.value],
    )

    _run_backfill()

    assert _status_values(package.id) == [PackageStatus.VERIFIED.value]
