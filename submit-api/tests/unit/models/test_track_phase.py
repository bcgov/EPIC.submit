"""Test TrackPhase model ORM methods."""

from faker import Faker

from submit_api.models.track_phase import TrackPhase

from tests.utilities.factory_utils import factory_track_phase

fake = Faker()


def test_find_by_work_type(session):
    """Returns active, non-deleted phases for the given work type id."""
    work_type_id = fake.random_int(min=1000, max=9999)
    phase = factory_track_phase(session, work_type_id=work_type_id)
    results = TrackPhase.find_by_work_type(work_type_id)
    assert any(r.id == phase.id for r in results)


def test_find_by_work_type_excludes_deleted(session):
    """Excludes soft-deleted phases when querying by work type."""
    work_type_id = fake.random_int(min=1000, max=9999)
    phase = factory_track_phase(session, work_type_id=work_type_id, is_deleted=True)
    results = TrackPhase.find_by_work_type(work_type_id)
    assert not any(r.id == phase.id for r in results)


def test_find_by_work_type_excludes_inactive(session):
    """Excludes inactive phases when querying by work type."""
    work_type_id = fake.random_int(min=1000, max=9999)
    phase = factory_track_phase(session, work_type_id=work_type_id, is_active=False)
    results = TrackPhase.find_by_work_type(work_type_id)
    assert not any(r.id == phase.id for r in results)


def test_find_active_phases(session):
    """Returns all active, non-deleted phases."""
    phase = factory_track_phase(session)
    results = TrackPhase.find_active_phases()
    assert any(r.id == phase.id for r in results)


def test_find_active_phases_excludes_deleted(session):
    """Excludes soft-deleted phases from the active phases list."""
    phase = factory_track_phase(session, is_deleted=True)
    results = TrackPhase.find_active_phases()
    assert not any(r.id == phase.id for r in results)


def test_find_by_identifiers_by_display_name(session):
    """Returns the phase matching ea_act_name, work_type_name, and display_name."""
    phase = factory_track_phase(
        session,
        ea_act_name='EA Act (2018)',
        work_type_name='Assessment',
        name='Technical Review',
        display_name='Early Engagement',
    )
    result = TrackPhase.find_by_identifiers(
        'EA Act (2018)', 'Assessment', 'Early Engagement'
    )
    assert result is not None
    assert result.id == phase.id


def test_find_by_identifiers_falls_back_to_name(session):
    """Falls back to matching on name when no display_name matches."""
    phase = factory_track_phase(
        session,
        ea_act_name='EA Act (2018)',
        work_type_name='Assessment',
        name='Technical Review',
        display_name=None,
    )
    result = TrackPhase.find_by_identifiers(
        'EA Act (2018)', 'Assessment', 'Technical Review'
    )
    assert result is not None
    assert result.id == phase.id


def test_find_by_identifiers_not_found(session):
    """Returns None when no phase matches the given identifiers."""
    result = TrackPhase.find_by_identifiers(
        'Nonexistent Act', 'Nonexistent Type', 'Nonexistent Phase'
    )
    assert result is None


def test_to_dict(session):
    """Returns a dictionary containing the expected track phase fields."""
    phase = factory_track_phase(session, work_type_id=42)
    d = phase.to_dict()
    assert d['id'] == phase.id
    assert d['name'] == phase.name
    assert d['work_type_id'] == 42
    assert 'legislated' in d
    assert 'display_name' in d
