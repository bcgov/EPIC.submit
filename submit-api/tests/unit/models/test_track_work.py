"""Test TrackWork model ORM methods."""

from submit_api.models.track_work import TrackWork

from tests.utilities.factory_utils import (
    factory_project_model,
    factory_track_phase,
    factory_track_work,
)


def test_find_by_project_id(session):
    """Returns non-deleted works for the given project id."""
    project = factory_project_model()
    work = factory_track_work(session, project_id=project.id)
    results = TrackWork.find_by_project_id(project.id)
    assert any(r.id == work.id for r in results)


def test_find_by_project_id_excludes_deleted(session):
    """Excludes soft-deleted works when querying by project id."""
    project = factory_project_model()
    work = factory_track_work(session, project_id=project.id, is_deleted=True)
    results = TrackWork.find_by_project_id(project.id)
    assert not any(r.id == work.id for r in results)


def test_find_by_project_id_not_found(session):
    """Returns an empty list when no works exist for the given project id."""
    results = TrackWork.find_by_project_id(999999)
    assert results == []


def test_find_active_works(session):
    """Returns all active, non-deleted works."""
    project = factory_project_model()
    work = factory_track_work(session, project_id=project.id)
    results = TrackWork.find_active_works()
    assert any(r.id == work.id for r in results)


def test_find_active_works_excludes_deleted(session):
    """Excludes soft-deleted works from the active works list."""
    project = factory_project_model()
    work = factory_track_work(session, project_id=project.id, is_deleted=True)
    results = TrackWork.find_active_works()
    assert not any(r.id == work.id for r in results)


def test_find_active_works_excludes_inactive(session):
    """Excludes inactive works from the active works list."""
    project = factory_project_model()
    work = factory_track_work(session, project_id=project.id, is_active=False)
    results = TrackWork.find_active_works()
    assert not any(r.id == work.id for r in results)


def test_to_dict(session):
    """Returns a dictionary containing the expected track work fields."""
    project = factory_project_model()
    work = factory_track_work(session, project_id=project.id, work_state='IN_PROGRESS')
    d = work.to_dict()
    assert d['id'] == work.id
    assert d['project_id'] == project.id
    assert d['work_state'] == 'IN_PROGRESS'
    assert 'title' in d
    assert 'current_phase' in d


def test_to_dict_with_phase(session):
    """Includes the serialized current phase in the dictionary when one is set."""
    project = factory_project_model()
    phase = factory_track_phase(session)
    work = factory_track_work(session, project_id=project.id, phase_id=phase.id)
    d = work.to_dict()
    assert d['current_phase'] is not None
    assert d['current_phase']['id'] == phase.id


def test_to_dict_without_phase(session):
    """Sets current_phase to None in the dictionary when no phase is associated."""
    project = factory_project_model()
    work = factory_track_work(session, project_id=project.id, phase_id=None)
    d = work.to_dict()
    assert d['current_phase'] is None
