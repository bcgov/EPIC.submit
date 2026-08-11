"""Unit tests for overlay suppression rules in PackageService._add_noncanonical_statuses."""
from submit_api.models.package import NonCanonicalPackageStatus
from submit_api.models.user import UserType
from submit_api.services.package_service import PackageService


class TestOverlaySuppression:
    """Tests for D16 overlay suppression: Updated hides Update Requested and Revision."""

    def test_updated_suppresses_update_requested(self):
        """When Updated is present, Update Requested is hidden."""
        statuses = []
        PackageService._add_noncanonical_statuses(
            statuses,
            has_open_update_request=True,
            has_updated_submission=True,
            has_revision_required=False,
            user_type=UserType.STAFF
        )
        assert NonCanonicalPackageStatus.UPDATED.value in statuses
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value not in statuses

    def test_updated_suppresses_revision_requested(self):
        """When Updated is present, Revision Requested is hidden for staff."""
        statuses = []
        PackageService._add_noncanonical_statuses(
            statuses,
            has_open_update_request=False,
            has_updated_submission=True,
            has_revision_required=True,
            user_type=UserType.STAFF
        )
        assert NonCanonicalPackageStatus.UPDATED.value in statuses
        assert NonCanonicalPackageStatus.REVISION_REQUESTED.value not in statuses

    def test_updated_suppresses_revision_required_for_proponent(self):
        """When Updated is present, Revision Required is hidden for proponent."""
        statuses = []
        PackageService._add_noncanonical_statuses(
            statuses,
            has_open_update_request=True,
            has_updated_submission=True,
            has_revision_required=True,
            user_type=UserType.PROPONENT
        )
        assert NonCanonicalPackageStatus.UPDATED.value in statuses
        assert NonCanonicalPackageStatus.REVISION_REQUIRED.value not in statuses
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value not in statuses

    def test_no_updated_shows_update_requested(self):
        """Without Updated, Update Requested appears normally."""
        statuses = []
        PackageService._add_noncanonical_statuses(
            statuses,
            has_open_update_request=True,
            has_updated_submission=False,
            has_revision_required=False,
            user_type=UserType.STAFF
        )
        assert NonCanonicalPackageStatus.UPDATE_REQUESTED.value in statuses
        assert NonCanonicalPackageStatus.UPDATED.value not in statuses

    def test_no_updated_shows_revision_required_for_proponent(self):
        """Without Updated, Revision Required appears for proponent."""
        statuses = []
        PackageService._add_noncanonical_statuses(
            statuses,
            has_open_update_request=False,
            has_updated_submission=False,
            has_revision_required=True,
            user_type=UserType.PROPONENT
        )
        assert NonCanonicalPackageStatus.REVISION_REQUIRED.value in statuses

    def test_no_updated_shows_revision_requested_for_staff(self):
        """Without Updated, Revision Requested appears for staff."""
        statuses = []
        PackageService._add_noncanonical_statuses(
            statuses,
            has_open_update_request=False,
            has_updated_submission=False,
            has_revision_required=True,
            user_type=UserType.STAFF
        )
        assert NonCanonicalPackageStatus.REVISION_REQUESTED.value in statuses
