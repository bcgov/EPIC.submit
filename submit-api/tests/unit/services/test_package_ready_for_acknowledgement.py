"""Unit tests for the READY_FOR_ACKNOWLEDGEMENT package status display.

An IPD (approval type C) package whose documents are all verified is stored with the
single READY_FOR_ACKNOWLEDGEMENT status. The EAO sees it on its own (no Verified and no
Pending Acknowledgement), the Regulated Party keeps seeing Submitted, and the
Update Requested / Updated overlays still show next to it.
"""
from unittest.mock import Mock

from submit_api.models.package import PackageStatus
from submit_api.models.update_request import UpdateRequestType
from submit_api.models.user import UserType
from submit_api.services.package_service import CANONICAL_STATUS_ORDER, PackageService


def _make_ipd_package(status, update_requests=()):
    """Build a mock IPD package with the given stored status list."""
    package = Mock()
    package.type.name = "IPD"
    package.status = status
    package.items = []
    package.update_requests = list(update_requests)
    package.version.version = 1
    return package


def _open_update_request():
    """Build an open UPDATE-type update request."""
    update_request = Mock()
    update_request.active = True
    update_request.status = 'OPEN'
    update_request.type = UpdateRequestType.UPDATE
    return update_request


class TestReadyForAcknowledgementDisplay:
    """How the stored READY_FOR_ACKNOWLEDGEMENT status is shown per audience."""

    def test_staff_sees_ready_for_acknowledgement_on_its_own(self):
        """The EAO sees only READY_FOR_ACKNOWLEDGEMENT, never Verified or Pending Acknowledgement."""
        package = _make_ipd_package([PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value])

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value]
        assert PackageStatus.VERIFIED.value not in result
        assert PackageStatus.PENDING_ACKNOWLEDGEMENT.value not in result

    def test_proponent_keeps_seeing_submitted(self):
        """The Regulated Party sees Submitted until the package is acknowledged."""
        package = _make_ipd_package([PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value])

        result = PackageService.calculate_package_statuses(package, UserType.PROPONENT)

        assert result == [PackageStatus.SUBMITTED.value]

    def test_update_requested_overlay_shows_next_to_ready_for_acknowledgement(self):
        """Update Requested is never hidden by the new status and sorts after it."""
        package = _make_ipd_package(
            [PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value],
            update_requests=[_open_update_request()],
        )

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [
            PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value,
            PackageStatus.UPDATE_REQUESTED.value,
        ]

    def test_internal_verification_is_unchanged(self):
        """A partly verified package still reads as Internal Verification."""
        package = _make_ipd_package([PackageStatus.INTERNAL_VERIFICATION.value])

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert result == [PackageStatus.INTERNAL_VERIFICATION.value]

    def test_acknowledged_package_shows_acknowledged_and_ready_for_approval(self):
        """After acknowledgement the package reads Acknowledged with Ready for Approval."""
        package = _make_ipd_package([
            PackageStatus.ACKNOWLEDGED.value,
            PackageStatus.READY_FOR_APPROVAL.value,
        ])

        result = PackageService.calculate_package_statuses(package, UserType.STAFF)

        assert PackageStatus.ACKNOWLEDGED.value in result
        assert PackageStatus.READY_FOR_APPROVAL.value in result
        assert PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value not in result

    def test_status_order_places_ready_for_acknowledgement_before_overlays(self):
        """READY_FOR_ACKNOWLEDGEMENT sorts in the acknowledgement stream, before overlays."""
        order = list(CANONICAL_STATUS_ORDER)

        assert order.index('READY_FOR_ACKNOWLEDGEMENT') > order.index('INTERNAL_VERIFICATION')
        assert order.index('READY_FOR_ACKNOWLEDGEMENT') < order.index('UPDATE_REQUESTED')
        assert order.index('READY_FOR_ACKNOWLEDGEMENT') < order.index('UPDATED')
        assert 'PENDING_ACKNOWLEDGEMENT' not in order
