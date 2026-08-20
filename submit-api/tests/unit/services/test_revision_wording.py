"""Unit tests for per-audience revision wording in calculate_package_statuses.

Tests for the scenario where a Management Plan review fails and a revision
is requested (REVIEW-type update request on new package version):

Expected behaviour:
- New package (open REVIEW-type update request, items in NEW status):
  - Entity sees: Revision Required
  - EAO sees: Revision Requested
- Old package (item in REVIEW_REJECTED, no open requests):
  - Entity sees: Revision Required  (via canonical mapping REVIEW_REJECTED -> REVISION_REQUIRED)
  - EAO sees: Review Rejected  (canonical)
"""
from unittest.mock import Mock

from submit_api.models.package import NonCanonicalPackageStatus, PackageStatus
from submit_api.models.update_request import UpdateRequestType, UpdateRequestStatus
from submit_api.models.user import UserType
from submit_api.services.package_service import PackageService

MODULE_PATH = "submit_api.services.package_service"


def _make_package(canonical_statuses, update_requests=None, version=1):
    """Create a mock package for calculate_package_statuses."""
    package = Mock()
    package.status = [s for s in canonical_statuses]
    package.update_requests = update_requests or []
    package.items = []
    version_mock = Mock()
    version_mock.version = version
    package.version = version_mock
    return package


def _make_update_request(request_type, is_active=True, status=UpdateRequestStatus.OPEN.value):
    """Create a mock UpdateRequest."""
    ur = Mock()
    ur.type = request_type
    ur.active = is_active
    ur.status = status
    return ur


class TestNewPackageRevisionWording:
    """New version package with open REVIEW-type request."""

    def test_entity_sees_revision_required_on_new_package(self):
        """Entity sees Revision Required when new package has open REVIEW-type request."""
        review_request = _make_update_request(UpdateRequestType.REVIEW)
        package = _make_package(
            canonical_statuses=[PackageStatus.NEW.value],
            update_requests=[review_request],
        )

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert NonCanonicalPackageStatus.REVISION_REQUIRED.value in result
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value not in result

    def test_eao_sees_revision_requested_on_new_package(self):
        """EAO sees Revision Requested when new package has open REVIEW-type request."""
        review_request = _make_update_request(UpdateRequestType.REVIEW)
        package = _make_package(
            canonical_statuses=[PackageStatus.NEW.value],
            update_requests=[review_request],
        )

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert NonCanonicalPackageStatus.REVISION_REQUESTED.value in result
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value not in result

    def test_update_type_request_shows_update_requested_for_both(self):
        """UPDATE-type request shows Update Requested for both entity and EAO."""
        update_request = _make_update_request(UpdateRequestType.UPDATE)
        package = _make_package(
            canonical_statuses=[PackageStatus.SUBMITTED.value],
            update_requests=[update_request],
        )

        result_proponent = PackageService.calculate_package_statuses(package, UserType.PROPONENT)
        result_staff = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value in result_proponent
        assert NonCanonicalPackageStatus.REVISION_REQUIRED.value not in result_proponent
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value in result_staff
        assert NonCanonicalPackageStatus.REVISION_REQUESTED.value not in result_staff

    def test_closed_review_request_does_not_trigger_revision(self):
        """A closed/deactivated REVIEW-type request does not show revision overlay."""
        closed_request = _make_update_request(
            UpdateRequestType.REVIEW,
            is_active=False,
            status=UpdateRequestStatus.CLOSED.value
        )
        package = _make_package(
            canonical_statuses=[PackageStatus.NEW.value],
            update_requests=[closed_request],
        )

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert NonCanonicalPackageStatus.REVISION_REQUIRED.value not in result

    def test_both_update_and_review_requests_review_wins_for_revision(self):
        """When both UPDATE and REVIEW requests are open, revision takes precedence over update."""
        review_request = _make_update_request(UpdateRequestType.REVIEW)
        update_request = _make_update_request(UpdateRequestType.UPDATE)
        package = _make_package(
            canonical_statuses=[PackageStatus.NEW.value],
            update_requests=[review_request, update_request],
        )

        result_staff = PackageService.calculate_package_statuses(package, UserType.STAFF)

        # REVIEW request forces revision_required = True
        assert NonCanonicalPackageStatus.REVISION_REQUESTED.value in result_staff
        # UPDATE request also present
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value in result_staff


class TestCanonicalRevisionRequiredStatus:
    """Tests for canonical REVISION_REQUIRED status mapping (no update request needed)."""

    def test_entity_sees_revision_required_from_canonical_status(self):
        """Entity sees REVISION_REQUIRED when package has canonical REVISION_REQUIRED status."""
        package = _make_package(
            canonical_statuses=[PackageStatus.REVISION_REQUIRED.value],
        )

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert PackageStatus.REVISION_REQUIRED.value in result

    def test_eao_sees_revision_requested_from_canonical_status(self):
        """EAO sees REVISION_REQUESTED when package has canonical REVISION_REQUIRED status."""
        package = _make_package(
            canonical_statuses=[PackageStatus.REVISION_REQUIRED.value],
        )

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert NonCanonicalPackageStatus.REVISION_REQUESTED.value in result
        assert PackageStatus.REVISION_REQUIRED.value not in result

    def test_canonical_revision_required_no_duplicate_with_overlay(self):
        """Canonical REVISION_REQUIRED does not produce duplicate statuses."""
        package = _make_package(
            canonical_statuses=[PackageStatus.REVISION_REQUIRED.value],
        )

        result_proponent = PackageService.calculate_package_statuses(package, UserType.PROPONENT)
        result_staff = PackageService.calculate_package_statuses(package, UserType.STAFF)

        # Check no duplicates
        assert len(result_proponent) == len(set(result_proponent))
        assert len(result_staff) == len(set(result_staff))
