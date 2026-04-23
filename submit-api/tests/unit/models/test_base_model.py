"""Test BaseModel (via models that extend it) ORM methods."""
from submit_api.models.account import Account
from submit_api.models.package import Package
from tests.utilities.factory_utils import factory_package_model, factory_proponent_model


def test_find_by_id(session):
    """Returns the model instance matching the given id."""
    package = factory_package_model()
    result = Package.find_by_id(package.id)
    assert result.id == package.id


def test_find_by_id_not_found(session):
    """Returns None when no record exists for the given id."""
    result = Package.find_by_id(999999)
    assert result is None


def test_persist_with_session(session):
    """Adds the instance to the session and flushes without committing."""
    proponent = factory_proponent_model()
    account = Account(proponent_id=proponent.id)
    result = account.persist(session)
    assert result is account


def test_persist_without_session(session):
    """Saves and commits the instance when no session is provided."""
    proponent = factory_proponent_model()  # noqa: F841
    # Use a second proponent so no unique constraint conflict
    proponent2 = factory_proponent_model()
    account = Account(proponent_id=proponent2.id)
    result = account.persist()
    assert result.id is not None
