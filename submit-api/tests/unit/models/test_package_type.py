"""Test PackageType model ORM methods."""
from submit_api.models.package_type import PackageType
from tests.utilities.factory_utils import factory_package_model


def test_find_by_name(session):
    """Returns the package type matching the given name."""
    package = factory_package_model()
    pt = PackageType.find_by_id(package.type_id)
    result = PackageType.find_by_name(pt.name)
    assert result.id == pt.id


def test_find_by_name_not_found(session):
    """Returns None when no package type matches the given name."""
    result = PackageType.find_by_name('Nonexistent Package Type')
    assert result is None
