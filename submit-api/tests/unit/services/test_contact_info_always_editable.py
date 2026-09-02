"""Unit tests for the always-editable Submission Contact Information rules."""
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import BadRequestError
from submit_api.models.item_type import SubmissionItemType, SubmissionMethod
from submit_api.models.package import PackageStatus
from submit_api.services.submission import SubmissionService


def _package(status=None, is_latest=True, completed_on=None):
    """Build a mock package with the given status list and latest-version flag."""
    package = Mock()
    package.status = status if status is not None else [PackageStatus.NEW]
    package.is_latest_version = is_latest
    package.completed_on = completed_on
    package.update_requests = []
    return package


def _item(type_name, package, status=ItemStatus.COMPLETED,
          submission_method=SubmissionMethod.FORM_SUBMISSION):
    """Build a mock item of the given type attached to the package."""
    item = Mock()
    item.type = Mock()
    item.type.name = type_name
    item.type.submission_method = submission_method
    item.status = status
    item.package = package
    item.package_id = 1
    return item


CONTACT = SubmissionItemType.CONTACT_INFORMATION.value
MANAGEMENT_PLAN = SubmissionItemType.MANAGEMENT_PLAN_FORM.value


class TestIsAlwaysEditableItem:
    """Tests for SubmissionService._is_always_editable_item."""

    def test_contact_info_on_latest_version_is_always_editable(self):
        """Contact information on the latest version is always editable."""
        item = _item(CONTACT, _package(is_latest=True))
        assert SubmissionService._is_always_editable_item(item) is True

    def test_contact_info_on_old_version_is_not_always_editable(self):
        """Contact information on an older version is not always editable."""
        item = _item(CONTACT, _package(is_latest=False))
        assert SubmissionService._is_always_editable_item(item) is False

    def test_non_contact_item_is_not_always_editable(self):
        """A non contact-information item is not always editable."""
        item = _item(MANAGEMENT_PLAN, _package(is_latest=True))
        assert SubmissionService._is_always_editable_item(item) is False

    def test_item_without_package_is_not_always_editable(self):
        """An item without a package is not always editable."""
        item = _item(CONTACT, None)
        assert SubmissionService._is_always_editable_item(item) is False


class TestValidatePackageNotAcknowledged:
    """Tests for SubmissionService._validate_package_not_acknowledged."""

    @patch("submit_api.services.submission.ItemModel")
    def test_contact_info_editable_when_package_approved(self, mock_item_model):
        """Contact info on the latest version is editable even when the package is approved."""
        package = _package(status=[PackageStatus.APPROVED], is_latest=True)
        mock_item_model.find_by_id.return_value = _item(CONTACT, package)

        # Should not raise
        SubmissionService._validate_package_not_acknowledged(1)

    @patch("submit_api.services.submission.ItemModel")
    def test_contact_info_editable_when_package_acknowledged(self, mock_item_model):
        """Contact info on the latest version is editable even when acknowledged with no requests."""
        package = _package(status=[PackageStatus.ACKNOWLEDGED.value], is_latest=True)
        mock_item_model.find_by_id.return_value = _item(CONTACT, package)

        # Should not raise
        SubmissionService._validate_package_not_acknowledged(1)

    @patch("submit_api.services.submission.ItemModel")
    def test_non_contact_item_blocked_when_package_approved(self, mock_item_model):
        """A non contact-information item is still blocked when the package is approved."""
        package = _package(status=[PackageStatus.APPROVED], is_latest=True)
        mock_item_model.find_by_id.return_value = _item(MANAGEMENT_PLAN, package)

        with pytest.raises(BadRequestError):
            SubmissionService._validate_package_not_acknowledged(1)

    @patch("submit_api.services.submission.ItemModel")
    def test_contact_info_on_old_version_blocked_when_approved(self, mock_item_model):
        """Contact information on an older version follows the normal status guards."""
        package = _package(status=[PackageStatus.APPROVED], is_latest=False)
        mock_item_model.find_by_id.return_value = _item(CONTACT, package)

        with pytest.raises(BadRequestError):
            SubmissionService._validate_package_not_acknowledged(1)


class TestGetSubmissionByIdAndValidateEdit:
    """Tests for SubmissionService.get_submission_by_id_and_validate_edit."""

    def _submission(self):
        """Build a minimal FORM submission mock."""
        from submit_api.models.submission import SubmissionType
        submission = Mock()
        submission.type = SubmissionType.FORM
        submission.submitted_form = Mock()
        submission.item_id = 1
        return submission

    @patch("submit_api.services.submission.ItemModel")
    @patch.object(SubmissionService, "get_submission_by_id")
    def test_contact_info_editable_when_item_completed(self, mock_get, mock_item_model):
        """Completed contact info on the latest version can still be edited."""
        submission = self._submission()
        mock_get.return_value = submission
        package = _package(is_latest=True)
        mock_item_model.find_by_id.return_value = _item(
            CONTACT, package, status=ItemStatus.APPROVED)

        result = SubmissionService.get_submission_by_id_and_validate_edit(1)

        assert result is submission

    @patch("submit_api.services.submission.PackageModel")
    @patch("submit_api.services.submission.ItemModel")
    @patch.object(SubmissionService, "get_submission_by_id")
    def test_non_contact_completed_item_blocked(self, mock_get, mock_item_model, mock_package_model):
        """A completed non contact-information item cannot be edited."""
        submission = self._submission()
        mock_get.return_value = submission
        package = _package(is_latest=True)
        mock_item_model.find_by_id.return_value = _item(
            MANAGEMENT_PLAN, package, status=ItemStatus.APPROVED)
        mock_package_model.find_by_id.return_value = package

        with pytest.raises(ValueError):
            SubmissionService.get_submission_by_id_and_validate_edit(1)
