from submit_api.models.package_type import PackageType
from tests.utilities.factory_utils import factory_package_model


def test_find_by_name(session):
    package = factory_package_model()
    pt = PackageType.find_by_id(package.type_id)
    result = PackageType.find_by_name(pt.name)
    assert result.id == pt.id

def test_find_by_name_not_found(session):
    result = PackageType.find_by_name('Nonexistent Package Type')
    assert result is None