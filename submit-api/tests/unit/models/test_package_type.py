"""Test PackageType model ORM methods."""
from submit_api.enums.package_type import PackageApprovalType, PackageTypeEnum
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


def test_report_type_b_is_not_seeded(session):
    """The retired Report_TypeB package type no longer exists."""
    assert PackageType.find_by_name('Report_TypeB') is None


def test_report_type_uses_verify_only_flow(session):
    """The regular Report type keeps the Verify-only (A) flow and is not versioned."""
    report_type = PackageType.find_by_name(PackageTypeEnum.REPORT.value)
    assert report_type is not None
    assert report_type.approval_type == PackageApprovalType.A
    assert report_type.versioning_enabled is False
