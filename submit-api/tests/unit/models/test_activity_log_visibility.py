"""Regression coverage for shared timeline classification and private activity."""
from pathlib import Path
from types import SimpleNamespace

from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory
import pytest

from submit_api.models.activity_log import ActivityLog
from submit_api.services.activity_log_service import ActivityLogService
from submit_api.services.package_service import PackageService
from tests.utilities.factory_utils import set_global_token_info


@pytest.mark.parametrize("action", ["Submitted to EAO", "Updated Submission"])
def test_submission_milestones_are_public(session, action):
    """New submission events remain visible to the owning proponent."""
    package = SimpleNamespace(id=101, version=SimpleNamespace(original_package_id=100, version=2))

    set_global_token_info()
    PackageService._log_activity_submission(package, action, session)
    session.flush()

    logs = ActivityLog.get_activity_logs("PACKAGE", 100, for_staff=False)
    assert len(logs) == 1
    assert logs[0].action == action
    assert logs[0].entity_version == 2
    assert logs[0].visibility == "PUBLIC"


def test_unclassified_events_remain_staff_only(session):
    """Logging an internal event without visibility stays private by default."""
    ActivityLogService.log_activity(101, "Internal staff event", actor_id="test-actor", session=session)
    session.flush()

    assert ActivityLog.get_activity_logs("PACKAGE", 101, for_staff=False) == []
    assert len(ActivityLog.get_activity_logs("PACKAGE", 101, for_staff=True)) == 1


def test_shared_activity_migration_is_scoped_and_idempotent(session, monkeypatch):
    """Correct known package milestones without publishing unrelated private logs."""
    migration_path = Path(__file__).resolve().parents[3] / "migrations"
    migration = ScriptDirectory(str(migration_path)).get_revision("c9e4a17b203d").module
    operations = Operations(MigrationContext.configure(session.connection()))
    monkeypatch.setattr(migration, "op", operations)
    cases = [
        ("PACKAGE", "Submitted to EAO", "STAFF", "PUBLIC"),
        ("PACKAGE", "MP Review Failed", "staff", "PUBLIC"),
        ("PACKAGE", "Internal staff event", "STAFF", "STAFF"),
        ("USER", "Submitted to EAO", "STAFF", "STAFF"),
        ("PACKAGE", "Submitted to EAO", "PUBLIC", "PUBLIC"),
    ]
    logs = []
    for entity_type, action, visibility, _ in cases:
        log = ActivityLog(
            entity_type=entity_type, entity_id=101, action=action,
            actor_id="test-actor", actor_type="STAFF", visibility=visibility,
        )
        session.add(log)
        logs.append(log)
    session.flush()

    migration.upgrade()
    migration.upgrade()
    session.expire_all()

    assert [log.visibility for log in logs] == [case[3] for case in cases]
    migration.downgrade()
    session.expire_all()
    assert [log.visibility for log in logs] == [case[3] for case in cases]
