from submit_api.models.proponent import Proponent
from tests.utilities.factory_utils import factory_proponent_model


def test_get_by_id(session):
    proponent = factory_proponent_model()
    result = Proponent.get_by_id(proponent.id)
    assert result.id == proponent.id

def test_get_by_id_not_found(session):
    result = Proponent.get_by_id(999999)
    assert result is None

def test_get_all_proponents_excludes_deleted(session):
    factory_proponent_model(is_deleted=True)
    results = Proponent.get_all_proponents(include_deleted=False)
    assert all(not p.is_deleted for p in results)

def test_get_all_proponents_includes_deleted(session):
    factory_proponent_model(is_deleted=True)
    results = Proponent.get_all_proponents(include_deleted=True)
    assert any(p.is_deleted for p in results)

def test_to_dict(session):
    proponent = factory_proponent_model()
    d = proponent.to_dict()
    assert d['id'] == proponent.id
    assert 'name' in d
    assert 'is_deleted' in d