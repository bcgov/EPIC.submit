"""Test Package model ORM methods."""
from submit_api.models.package import NonCanonicalPackageStatus, Package, PackageStatus
from tests.utilities.factory_utils import factory_package_model


def test_get_package_by_id_with_items(session):
    """Returns the package with items eagerly loaded."""
    package = factory_package_model()
    result = Package.get_package_by_id_with_items(package.id)
    assert result.id == package.id


def test_get_all_package_by_ids(session):
    """Returns all packages matching the given list of ids."""
    package = factory_package_model()
    results = Package.get_all_package_by_ids([package.id])
    assert any(p.id == package.id for p in results)


def test_get_account_project_id_by_package_id(session):
    """Returns the account project id for the given package id."""
    package = factory_package_model()
    result = Package.get_account_project_id_by_package_id(package.id)
    assert result == package.account_project_id


def test_update_requests_property_returns_active_only(session):
    """Returns only active update requests via the update_requests property."""
    package = factory_package_model()
    assert isinstance(package.update_requests, list)


def test_check_value_valid():
    """Returns the matching PackageStatus member for a valid status string."""
    result = PackageStatus.check_value('NEW')
    assert result == PackageStatus.NEW


def test_check_value_invalid():
    """Returns None for a string that does not match any PackageStatus member."""
    result = PackageStatus.check_value('INVALID_STATUS')
    assert result is None


def test_non_canonical_check_value():
    """Returns the matching NonCanonicalPackageStatus member for a valid value."""
    result = NonCanonicalPackageStatus.check_value('UPDATED')
    assert result == NonCanonicalPackageStatus.UPDATED


def test_is_archived_follows_archived_on(session):
    """A package is archived exactly when archived_on is set."""
    from datetime import datetime, timezone
    package = factory_package_model()
    assert package.is_archived is False

    package.archived_on = datetime.now(timezone.utc)
    assert package.is_archived is True


def test_ensure_not_archived_passes_for_active_package(session):
    """The guard does nothing for a package that is not archived."""
    package = factory_package_model()
    package.ensure_not_archived()


def test_ensure_not_archived_raises_conflict_for_archived_package(session):
    """The guard raises a 409 conflict for an archived package."""
    from datetime import datetime, timezone
    from submit_api.exceptions import ResourceExistsError
    import pytest

    package = factory_package_model()
    package.archived_on = datetime.now(timezone.utc)

    with pytest.raises(ResourceExistsError) as error:
        package.ensure_not_archived()
    assert error.value.code == 409


def test_is_finished_python_side(session):
    """is_finished is true for an end status and false while the package is awaiting approval."""
    approved = Package(status=[PackageStatus.APPROVED.value])
    in_review = Package(status=[PackageStatus.UNDER_REVIEW.value])
    acknowledged_for_approval = Package(
        status=[PackageStatus.ACKNOWLEDGED, PackageStatus.READY_FOR_APPROVAL])
    empty = Package(status=None)

    assert approved.is_finished is True
    assert in_review.is_finished is False
    assert acknowledged_for_approval.is_finished is False
    assert empty.is_finished is False
