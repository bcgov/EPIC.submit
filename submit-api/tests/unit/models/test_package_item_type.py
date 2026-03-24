from submit_api.models.package_item_type import PackageItemType
from tests.utilities.factory_utils import factory_package_model


def test_get_by_package_type_id(session):
    package = factory_package_model()
    results = PackageItemType.get_by_package_type_id(package.type_id)
    assert isinstance(results, list)

def test_delete_by_package_type_id(session):
    package = factory_package_model()
    PackageItemType.delete_by_package_type_id(package.type_id)
    results = PackageItemType.get_by_package_type_id(package.type_id)
    assert results == []