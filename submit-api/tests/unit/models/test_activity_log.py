"""Test ActivityLog model ORM methods."""
from datetime import datetime

from submit_api.models.activity_log import ActivityLog


def test_get_activity_logs_for_staff(session):
    """Returns all logs including staff-only entries when for_staff is True."""
    log = ActivityLog(
        entity_type='PACKAGE',
        entity_id=1,
        action='SUBMITTED',
        actor_id='user-1',
        actor_type='STAFF',
        visibility='staff',
    )
    session.add(log)
    session.flush()
    results = ActivityLog.get_activity_logs('PACKAGE', 1, for_staff=True)
    assert len(results) >= 1


def test_get_activity_logs_public_only(session):
    """Returns only public-visibility logs when for_staff is False."""
    session.add(
        ActivityLog(
            entity_type='PACKAGE',
            entity_id=2,
            action='SUBMITTED',
            actor_id='user-1',
            actor_type='STAFF',
            visibility='staff',
        )
    )
    session.add(
        ActivityLog(
            entity_type='PACKAGE',
            entity_id=2,
            action='APPROVED',
            actor_id='user-1',
            actor_type='STAFF',
            visibility='public',
        )
    )
    session.flush()
    results = ActivityLog.get_activity_logs('PACKAGE', 2, for_staff=False)
    assert all(r.visibility == 'public' for r in results)


def test_to_dict(session):
    """Returns a dictionary containing the expected activity log fields."""
    log = ActivityLog(
        entity_type='PACKAGE',
        entity_id=3,
        action='SUBMITTED',
        actor_id='user-1',
        actor_type='STAFF',
        visibility='staff',
        activity_at=datetime.now(),
    )
    session.add(log)
    session.flush()
    d = log.to_dict()
    assert d['action'] == 'SUBMITTED'
    assert 'activity_at' in d
