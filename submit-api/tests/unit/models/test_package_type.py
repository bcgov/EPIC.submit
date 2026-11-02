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


def test_report_type_b_is_seeded_with_approval_type_b(session):
    """Report_TypeB is seeded as a report type with the Acknowledge (B) flow."""
    report_type_b = PackageType.find_by_name(PackageTypeEnum.REPORT_TYPE_B.value)
    assert report_type_b is not None
    assert report_type_b.approval_type == PackageApprovalType.B
    # Report-style types are not versioned.
    assert report_type_b.versioning_enabled is False
    assert report_type_b.mandatory is False


def test_report_type_b_clones_report_item_types(session):
    """Report_TypeB exposes the same item types as the regular Report type."""
    report_type = PackageType.find_by_name(PackageTypeEnum.REPORT.value)
    report_type_b = PackageType.find_by_name(PackageTypeEnum.REPORT_TYPE_B.value)
    assert report_type is not None and report_type_b is not None

    report_item_names = sorted(it.name for it in report_type.item_types)
    report_b_item_names = sorted(it.name for it in report_type_b.item_types)
    assert report_b_item_names == report_item_names
    # And the regular Report type keeps the Verify-only (A) flow.
    assert report_type.approval_type == PackageApprovalType.A
