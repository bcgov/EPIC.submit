"""Test Project model ORM methods."""
from submit_api.models.project import Project
from tests.utilities.factory_utils import factory_project_model


def test_get_all_projects_in_ids(session):
    """Returns all projects matching the given list of ids."""
    project = factory_project_model()
    results = Project.get_all_projects_in_ids([project.id])
    assert any(p.id == project.id for p in results)


def test_get_all_by_proponent_id(session):
    """Returns all projects for the given proponent id, ordered by name."""
    project = factory_project_model()
    results = Project.get_all_by_proponent_id(project.proponent_id)
    assert any(p.id == project.id for p in results)


def test_get_one_by_proponent_id(session):
    """Returns the first project found for the given proponent id."""
    project = factory_project_model()
    result = Project.get_one_by_proponent_id(project.proponent_id)
    assert result is not None


def test_to_dict(session):
    """Returns a dictionary with the expected project fields."""
    project = factory_project_model()
    d = project.to_dict()
    assert d['id'] == project.id
    assert 'name' in d
    assert 'proponent_id' in d
