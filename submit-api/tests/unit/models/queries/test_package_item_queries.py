"""Unit tests for PackageItemQueries.aggregate_item_statuses.

Tests for D1/D21: MP and IEM packages produce IN_PROGRESS instead of
PARTIALLY_COMPLETED/COMPLETED at the package level.
"""
from unittest.mock import Mock, patch

from submit_api.enums.item_status import ItemStatus
from submit_api.models.package import PackageStatus
from submit_api.models.queries.package import PackageItemQueries

MODULE_PATH = "submit_api.models.queries.package"


def _make_item(status_value, type_id=1, package_id=1, submissions=None):
    """Create a mock item with the given status."""
    item = Mock()
    item.status = ItemStatus(status_value)
    item.type_id = type_id
    item.package_id = package_id
    item.submissions = submissions or []
    return item


def _make_package(type_name, type_id=1, submitted_on=None):
    """Create a mock package with the given type."""
    package = Mock()
    package.type = Mock()
    package.type.name = type_name
    package.type_id = type_id
    package.submitted_on = submitted_on
    return package


def _make_package_item_type(item_type_id, is_required=True):
    """Create a mock PackageItemType."""
    pit = Mock()
    pit.item_type_id = item_type_id
    pit.is_required = is_required
    return pit


class TestMPIEMInProgressStatus:
    """Tests for MP/IEM packages producing IN_PROGRESS."""

    @patch(f"{MODULE_PATH}.PackageItemType.get_by_package_type_id")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_mp_partially_completed_item_produces_in_progress(
        self, mock_find_by_id, mock_get_pit
    ):
        """MP package with PARTIALLY_COMPLETED item produces IN_PROGRESS."""
        package = _make_package("Management Plan")
        mock_find_by_id.return_value = package
        mock_get_pit.return_value = [_make_package_item_type(1, is_required=True)]

        items = [_make_item(ItemStatus.PARTIALLY_COMPLETED.value, type_id=1)]

        result = PackageItemQueries.aggregate_item_statuses(items)

        assert PackageStatus.IN_PROGRESS.value in result
        assert PackageStatus.PARTIALLY_COMPLETED.value not in result

    @patch(f"{MODULE_PATH}.PackageItemType.get_by_package_type_id")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_mp_all_items_completed_produces_in_progress(
        self, mock_find_by_id, mock_get_pit
    ):
        """MP package with all items COMPLETED produces IN_PROGRESS, not COMPLETED."""
        package = _make_package("Management Plan")
        mock_find_by_id.return_value = package
        mock_get_pit.return_value = [
            _make_package_item_type(1, is_required=True),
            _make_package_item_type(2, is_required=True),
        ]

        items = [
            _make_item(ItemStatus.COMPLETED.value, type_id=1),
            _make_item(ItemStatus.COMPLETED.value, type_id=2),
        ]

        result = PackageItemQueries.aggregate_item_statuses(items)

        assert PackageStatus.IN_PROGRESS.value in result
        assert PackageStatus.COMPLETED.value not in result

    @patch(f"{MODULE_PATH}.PackageItemType.get_by_package_type_id")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_iem_partially_completed_item_produces_in_progress(
        self, mock_find_by_id, mock_get_pit
    ):
        """IEM package with PARTIALLY_COMPLETED item produces IN_PROGRESS."""
        package = _make_package("IEM")
        mock_find_by_id.return_value = package
        mock_get_pit.return_value = [_make_package_item_type(1, is_required=True)]

        items = [_make_item(ItemStatus.PARTIALLY_COMPLETED.value, type_id=1)]

        result = PackageItemQueries.aggregate_item_statuses(items)

        assert PackageStatus.IN_PROGRESS.value in result
        assert PackageStatus.PARTIALLY_COMPLETED.value not in result

    @patch(f"{MODULE_PATH}.PackageItemType.get_by_package_type_id")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_mp_submitted_status_takes_priority_over_in_progress(
        self, mock_find_by_id, mock_get_pit
    ):
        """MP package with all required items SUBMITTED does not produce IN_PROGRESS."""
        package = _make_package("Management Plan")
        mock_find_by_id.return_value = package
        mock_get_pit.return_value = [_make_package_item_type(1, is_required=True)]

        items = [_make_item(ItemStatus.SUBMITTED.value, type_id=1)]

        result = PackageItemQueries.aggregate_item_statuses(items)

        assert PackageStatus.SUBMITTED.value in result
        assert PackageStatus.IN_PROGRESS.value not in result


class TestNonMPIEMPackagesUnchanged:
    """Tests that non-MP/IEM packages still use PARTIALLY_COMPLETED/COMPLETED."""

    @patch(f"{MODULE_PATH}.PackageItemType.get_by_package_type_id")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_additional_info_partially_completed_still_works(
        self, mock_find_by_id, mock_get_pit
    ):
        """Additional Information package still produces PARTIALLY_COMPLETED."""
        package = _make_package("Additional Information")
        mock_find_by_id.return_value = package
        mock_get_pit.return_value = [_make_package_item_type(1, is_required=True)]

        items = [_make_item(ItemStatus.PARTIALLY_COMPLETED.value, type_id=1)]

        result = PackageItemQueries.aggregate_item_statuses(items)

        assert PackageStatus.PARTIALLY_COMPLETED.value in result
        assert PackageStatus.IN_PROGRESS.value not in result

    @patch(f"{MODULE_PATH}.PackageItemType.get_by_package_type_id")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_additional_info_completed_still_works(
        self, mock_find_by_id, mock_get_pit
    ):
        """Additional Information package still produces COMPLETED."""
        package = _make_package("Additional Information")
        mock_find_by_id.return_value = package
        mock_get_pit.return_value = [_make_package_item_type(1, is_required=True)]

        items = [_make_item(ItemStatus.COMPLETED.value, type_id=1)]

        result = PackageItemQueries.aggregate_item_statuses(items)

        assert PackageStatus.COMPLETED.value in result
        assert PackageStatus.IN_PROGRESS.value not in result


class TestMPIEMNewItemsProduceEmpty:
    """Tests that MP/IEM packages with only NEW items produce no special status."""

    @patch(f"{MODULE_PATH}.PackageItemType.get_by_package_type_id")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_mp_all_items_new_produces_empty(
        self, mock_find_by_id, mock_get_pit
    ):
        """MP package with all items in NEW produces no completion/progress status."""
        package = _make_package("Management Plan")
        mock_find_by_id.return_value = package
        mock_get_pit.return_value = [_make_package_item_type(1, is_required=True)]

        items = [_make_item(ItemStatus.NEW.value, type_id=1)]

        result = PackageItemQueries.aggregate_item_statuses(items)

        assert PackageStatus.IN_PROGRESS.value not in result
        assert PackageStatus.PARTIALLY_COMPLETED.value not in result
        assert PackageStatus.COMPLETED.value not in result
