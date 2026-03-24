"""Test Proponent model ORM methods."""
from submit_api.models.proponent import Proponent
from tests.utilities.factory_utils import factory_proponent_model


def test_get_by_id(session):
    """Returns the proponent matching the given id."""
    proponent = factory_proponent_model()
    result = Proponent.get_by_id(proponent.id)
    assert result.id == proponent.id


def test_get_by_id_not_found(session):
    """Returns None when no proponent exists for the given id."""
    result = Proponent.get_by_id(999999)
    assert result is None


def test_get_all_proponents_excludes_deleted(session):
    """Excludes soft-deleted proponents when include_deleted is False."""
    factory_proponent_model(is_deleted=True)
    results = Proponent.get_all_proponents(include_deleted=False)
    assert all(not p.is_deleted for p in results)


def test_get_all_proponents_includes_deleted(session):
    """Includes soft-deleted proponents when include_deleted is True."""
    factory_proponent_model(is_deleted=True)
    results = Proponent.get_all_proponents(include_deleted=True)
    assert any(p.is_deleted for p in results)


def test_to_dict(session):
    """Returns a dictionary with the expected proponent fields."""
    proponent = factory_proponent_model()
    d = proponent.to_dict()
    assert d['id'] == proponent.id
    assert 'name' in d
    assert 'is_deleted' in d
