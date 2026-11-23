"""Unit tests for the archived-package write guard in the package and submission services."""
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

import submit_api.services.package_service as package_service_module
from submit_api.exceptions import ResourceExistsError
from submit_api.models.package import Package
from submit_api.services.package_service import PackageService
from submit_api.services.submission import SubmissionService


def _package(archived: bool) -> Package:
    """Build an in-memory package, archived or not."""
    package = Package(id=1, archived_on=datetime.now(timezone.utc) if archived else None)
    package.completed_on = None
    return package


@pytest.fixture(autouse=True)
def mock_current_app():
    """Patch current_app to avoid application context errors."""
    with patch.object(package_service_module, "current_app", MagicMock()):
        yield


class TestPackageServiceGuard:
    """PackageService entry points reject archived packages."""

    def test_complete_package_validation_rejects_archived_package(self):
        """Submitting an archived package fails before any completeness validation."""
        with patch.object(package_service_module.PackageModel, "find_by_id", return_value=_package(True)), \
                patch.object(PackageService, "_validate_completeness") as validate_completeness:
            with pytest.raises(ResourceExistsError):
                PackageService._get_and_validate_complete_package(1)
        validate_completeness.assert_not_called()

    def test_complete_package_validation_continues_for_active_package(self):
        """A package that is not archived goes on to the normal completeness validation."""
        package = _package(False)
        package.type = MagicMock()
        package.type.name = "Additional Information"
        package.submitted_on = None
        with patch.object(package_service_module.PackageModel, "find_by_id", return_value=package), \
                patch.object(PackageService, "_validate_completeness") as validate_completeness:
            assert PackageService._get_and_validate_complete_package(1) is package
        validate_completeness.assert_called_once_with(package)

    def test_update_request_validation_rejects_archived_package(self):
        """An update request cannot be created for an archived package."""
        with patch.object(PackageService, "get_package_by_id", return_value=_package(True)):
            with pytest.raises(ResourceExistsError):
                PackageService._get_and_validate_package_for_update_request(1)

    def test_review_validation_rejects_archived_package(self):
        """A review cannot be started for an archived package."""
        with patch.object(PackageService, "get_package_by_id", return_value=_package(True)):
            with pytest.raises(ResourceExistsError):
                PackageService._get_and_validate_package_for_starting_review(1)


class TestSubmissionServiceGuard:
    """SubmissionService mutation checks reject archived packages."""

    def test_validate_package_is_open_rejects_archived_package(self):
        """Changing a submission of an archived package is rejected."""
        with pytest.raises(ResourceExistsError):
            SubmissionService._validate_package_is_open(1, submission_package=_package(True))

    def test_validate_package_is_open_accepts_active_package(self):
        """A package that is not archived or completed is open."""
        package = _package(False)
        assert SubmissionService._validate_package_is_open(1, submission_package=package) is package
