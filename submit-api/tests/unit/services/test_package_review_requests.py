"""Unit tests for how carried REVIEW-type update requests are handled on submission.

A package version created after a failed review carries the manager's revision rationale as a
REVIEW-type update request. On the *first* submission of that version the request must be closed
(no "Updated" badge), while a within-package resubmission keeps moving requests to PENDING_REVIEW.
"""
from unittest.mock import Mock, patch

import pytest

from submit_api.models.update_request import UpdateRequestStatus, UpdateRequestType
from submit_api.services.package_service import PackageService


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Patch current_app so the service's logger calls work without an app context."""
    with patch("submit_api.services.package_service.current_app", new=Mock()):
        yield


def _update_request(request_type, status=UpdateRequestStatus.OPEN.value, active=True):
    """Build a mock update request with the given type/status/active."""
    request = Mock()
    request.type = request_type
    request.status = status
    request.active = active
    return request


def _package(update_requests):
    """Build a mock package exposing the given active update requests."""
    package = Mock()
    package.id = 1
    package.update_requests = update_requests
    return package


class TestCloseCarriedReviewRequests:
    """Tests for PackageService._close_carried_review_requests (first submission)."""

    def test_carried_review_request_is_closed(self):
        """A carried REVIEW-type request is closed and deactivated on first submission."""
        review_request = _update_request(UpdateRequestType.REVIEW)
        package = _package([review_request])

        PackageService._close_carried_review_requests(package, Mock())

        assert review_request.status == UpdateRequestStatus.CLOSED.value
        assert review_request.active is False

    def test_update_request_is_untouched(self):
        """UPDATE-type requests are not affected on first submission."""
        update_request = _update_request(UpdateRequestType.UPDATE)
        package = _package([update_request])

        PackageService._close_carried_review_requests(package, Mock())

        assert update_request.status == UpdateRequestStatus.OPEN.value
        assert update_request.active is True

    def test_only_review_requests_closed_in_mixed_package(self):
        """Only REVIEW-type requests are closed when both types are present."""
        review_request = _update_request(UpdateRequestType.REVIEW)
        update_request = _update_request(UpdateRequestType.UPDATE)
        package = _package([review_request, update_request])

        PackageService._close_carried_review_requests(package, Mock())

        assert review_request.status == UpdateRequestStatus.CLOSED.value
        assert review_request.active is False
        assert update_request.status == UpdateRequestStatus.OPEN.value
        assert update_request.active is True


class TestDeactivateRevisionRequiredRequests:
    """Tests for the within-package resubmission path (behavior unchanged)."""

    def test_review_request_moved_to_pending_review(self):
        """On resubmission a REVIEW-type request is moved to PENDING_REVIEW and stays active."""
        review_request = _update_request(UpdateRequestType.REVIEW)
        package = _package([review_request])

        PackageService._deactivate_revision_required_requests(package, Mock())

        assert review_request.status == UpdateRequestStatus.PENDING_REVIEW.value
        assert review_request.active is True
