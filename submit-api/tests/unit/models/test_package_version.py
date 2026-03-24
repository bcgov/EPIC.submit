from submit_api.models.package_version import PackageVersion
from tests.utilities.factory_utils import factory_package_model


def test_get_by_id(session):
    package = factory_package_model()
    result = PackageVersion.get_by_id(package.version_id)
    assert result is not None
    assert result.id == package.version_id

def test_get_all_by_original_package_id(session):
    package = factory_package_model()
    pv = PackageVersion.get_by_id(package.version_id)
    results = PackageVersion.get_all_by_original_package_id(pv.original_package_id)
    assert len(results) >= 1