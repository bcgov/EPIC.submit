"""Unit tests for NEW package badge status in calculate_package_statuses.

When a proponent creates a new package version from a package in an approved
status (Approved/Accepted/Satisfied), the new package is created with the NEW
status and a version greater than 1. Both the proponent (Entity) and the EAO
(Staff) should see the "New" badge for that package.

For a brand-new (version 1) package the Entity sees "New" while the EAO sees
"Created".
"""
from unittest.mock import Mock

from submit_api.models.package import PackageStatus
from submit_api.models.user import UserType
from submit_api.services.package_service import PackageService


def _make_package(canonical_statuses, version=1):
    """Create a mock package for calculate_package_statuses."""
    package = Mock()
    package.status = [s for s in canonical_statuses]
    package.update_requests = []
    package.items = []
    version_mock = Mock()
    version_mock.version = version
    package.version = version_mock
    return package


class TestNewPackageStatusBadge:
    """Badge status mapping for packages in NEW status."""

    def test_proponent_sees_new_on_newly_created_version(self):
        """Proponent sees New for a NEW package created as a later version."""
        package = _make_package([PackageStatus.NEW.value], version=2)

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert PackageStatus.NEW.value in result

    def test_proponent_sees_new_on_first_version(self):
        """Proponent still sees New for a NEW package on the first version."""
        package = _make_package([PackageStatus.NEW.value], version=1)

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert PackageStatus.NEW.value in result

    def test_staff_sees_new_on_later_version(self):
        """Staff sees New (not Created) for a NEW package created as a later version.

        A later version in NEW status is produced by the proponent using the
        "+ Create New" button on an already-approved package, so the EAO should
        see the "New" badge rather than the version-1 "Created" badge.
        """
        package = _make_package([PackageStatus.NEW.value], version=2)

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert PackageStatus.NEW.value in result
        assert PackageStatus.CREATED.value not in result

    def test_staff_sees_created_on_first_version(self):
        """Staff sees Created for a NEW package on the first version."""
        package = _make_package([PackageStatus.NEW.value], version=1)

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert PackageStatus.CREATED.value in result


class TestSubmittedPackageStatusBadge:
    """Badge status mapping for packages in SUBMITTED status."""

    def test_staff_sees_resubmitted_on_later_version(self):
        """EAO/staff sees Resubmitted for a SUBMITTED package on version 2+."""
        package = _make_package([PackageStatus.SUBMITTED.value], version=2)

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert PackageStatus.RESUBMITTED.value in result
        assert PackageStatus.NEW_SUBMISSION.value not in result

    def test_staff_sees_new_submission_on_first_version(self):
        """EAO/staff sees New Submission for a SUBMITTED package on the first version."""
        package = _make_package([PackageStatus.SUBMITTED.value], version=1)

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert PackageStatus.NEW_SUBMISSION.value in result
        assert PackageStatus.RESUBMITTED.value not in result

    def test_proponent_sees_submitted_regardless_of_version(self):
        """Proponent sees Submitted for a SUBMITTED package on any version."""
        package = _make_package([PackageStatus.SUBMITTED.value], version=3)

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert PackageStatus.SUBMITTED.value in result
