from submit_api.models.package import Package, PackageStatus
from submit_api.models.package_metadata import PackageMetadata
from tests.utilities.factory_utils import (
    factory_account_model, factory_account_project_model, factory_package_model, factory_project_model,
    factory_proponent_model)


def test_get_by_package_id(session):
    package = factory_package_model()
    result = PackageMetadata.get_by_package_id(package.id)
    assert result is not None
    assert result.package_id == package.id

def test_get_by_package_id_not_found(session):
    result = PackageMetadata.get_by_package_id(999999)
    assert result is None

def test_get_or_create_returns_existing(session):
    package = factory_package_model()
    result = PackageMetadata.get_or_create(package.id)
    assert result.package_id == package.id

def test_get_or_create_creates_new(session):
    proponent = factory_proponent_model()
    account = factory_account_model(proponent_id=proponent.id)
    project = factory_project_model(proponent_id=proponent.id)
    ap = factory_account_project_model(account.id, project.id)
    pkg = Package(account_project_id=ap.id, name='Test', type_id=1,
                    status=[PackageStatus.NEW.value])
    session.add(pkg)
    session.flush()
    result = PackageMetadata.get_or_create(pkg.id)
    assert result.package_id == pkg.id
    assert result.json == {}