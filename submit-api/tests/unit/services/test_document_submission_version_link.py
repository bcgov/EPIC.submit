"""Unit tests for cross-package root_submission_id linking in DocumentSubmissionCreator."""
from unittest.mock import Mock, patch

import pytest

from submit_api.services.submission import submission_creator_factory as factory_module
from submit_api.models.submission import SubmissionStatus, SubmissionType
from submit_api.services.submission.submission_creator_factory import DocumentSubmissionCreator


MODULE_PATH = "submit_api.services.submission.submission_creator_factory"


@pytest.fixture(autouse=True)
def mock_current_app():
    """Patch current_app to avoid application context errors."""
    with patch.object(factory_module, "current_app", new=Mock()):
        yield


@pytest.fixture()
def mock_item():
    """Create a mock item."""
    item = Mock()
    item.id = 10
    item.package_id = 100
    item.type_id = 5
    return item


@pytest.fixture()
def mock_package_version_2():
    """Create a mock package that is version 2."""
    package = Mock()
    package.id = 100
    package.version = Mock()
    package.version.version = 2
    package.version.original_package_id = 50
    return package


@pytest.fixture()
def mock_package_version_1():
    """Create a mock package that is version 1."""
    package = Mock()
    package.id = 80
    package.version = Mock()
    package.version.version = 1
    package.version.original_package_id = 50
    return package


@pytest.fixture()
def mock_previous_item():
    """Create a mock item from the previous package version."""
    item = Mock()
    item.id = 8
    item.package_id = 80
    item.type_id = 5
    return item


@pytest.fixture()
def mock_previous_submission():
    """Create a mock submission from the previous package version."""
    submission = Mock()
    submission.id = 110
    submission.root_submission_id = 110
    submission.major_version = 1
    submission.minor_version = 2
    submission.type = SubmissionType.DOCUMENT
    submission.status = SubmissionStatus.SUBMITTED
    submission.active = True
    submission.deleted = False
    submission.submitted_document = Mock()
    submission.submitted_document.folder = "management_plans"
    return submission


class TestResolveRootSubmissionIdFromPreviousVersion:
    """Tests for _resolve_root_submission_id_from_previous_version."""

    @patch(f"{MODULE_PATH}.SubmissionModel")
    @patch(f"{MODULE_PATH}.ItemModel")
    @patch(f"{MODULE_PATH}.PackageVersionModel")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_links_root_submission_id_on_version_2_package(
        self, mock_find_package, mock_pv_model, mock_item_model, mock_sub_model,
        mock_item, mock_package_version_2, mock_previous_item, mock_previous_submission
    ):
        """Version 2+ package correctly links to previous version's root_submission_id."""
        mock_item_model.find_by_id.return_value = mock_item
        mock_find_package.return_value = mock_package_version_2

        # PackageVersion query for previous version
        mock_prev_version = Mock()
        mock_prev_version.package = Mock()
        mock_prev_version.package.id = 80
        mock_pv_model.query.filter_by.return_value.first.return_value = mock_prev_version

        # Item query for previous package's matching item
        mock_item_model.query.filter_by.return_value.first.return_value = mock_previous_item

        # Submission query for previous item's submissions
        mock_sub_model.query.filter_by.return_value.filter.return_value \
            .order_by.return_value.all.return_value = [mock_previous_submission]

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=10, folder="management_plans"
        )

        assert result == 110

    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.ItemModel")
    def test_returns_none_for_version_1_package(
        self, mock_item_model, mock_find_package,
        mock_item, mock_package_version_1
    ):
        """Version 1 package should not attempt to link (returns None)."""
        mock_item_model.find_by_id.return_value = mock_item
        mock_find_package.return_value = mock_package_version_1

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=10, folder="management_plans"
        )

        assert result is None

    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    @patch(f"{MODULE_PATH}.ItemModel")
    def test_returns_none_when_package_has_no_version(
        self, mock_item_model, mock_find_package, mock_item
    ):
        """Package without a version record should not link."""
        mock_item_model.find_by_id.return_value = mock_item
        mock_package = Mock()
        mock_package.version = None
        mock_find_package.return_value = mock_package

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=10, folder="management_plans"
        )

        assert result is None

    @patch(f"{MODULE_PATH}.SubmissionModel")
    @patch(f"{MODULE_PATH}.ItemModel")
    @patch(f"{MODULE_PATH}.PackageVersionModel")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_returns_none_when_no_previous_submissions(
        self, mock_find_package, mock_pv_model, mock_item_model, mock_sub_model,
        mock_item, mock_package_version_2, mock_previous_item
    ):
        """No previous document submissions means no linkage."""
        mock_item_model.find_by_id.return_value = mock_item
        mock_find_package.return_value = mock_package_version_2

        mock_prev_version = Mock()
        mock_prev_version.package = Mock()
        mock_prev_version.package.id = 80
        mock_pv_model.query.filter_by.return_value.first.return_value = mock_prev_version

        mock_item_model.query.filter_by.return_value.first.return_value = mock_previous_item

        mock_sub_model.query.filter_by.return_value.filter.return_value \
            .order_by.return_value.all.return_value = []

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=10, folder="management_plans"
        )

        assert result is None

    @patch(f"{MODULE_PATH}.SubmissionModel")
    @patch(f"{MODULE_PATH}.ItemModel")
    @patch(f"{MODULE_PATH}.PackageVersionModel")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_returns_none_when_multiple_submissions_in_same_folder(
        self, mock_find_package, mock_pv_model, mock_item_model, mock_sub_model,
        mock_item, mock_package_version_2, mock_previous_item
    ):
        """Multiple previous submissions in the same folder cannot be mapped."""
        mock_item_model.find_by_id.return_value = mock_item
        mock_find_package.return_value = mock_package_version_2

        mock_prev_version = Mock()
        mock_prev_version.package = Mock()
        mock_prev_version.package.id = 80
        mock_pv_model.query.filter_by.return_value.first.return_value = mock_prev_version

        mock_item_model.query.filter_by.return_value.first.return_value = mock_previous_item

        sub1 = Mock()
        sub1.root_submission_id = 110
        sub1.submitted_document = Mock()
        sub1.submitted_document.folder = "management_plans"

        sub2 = Mock()
        sub2.root_submission_id = 112
        sub2.submitted_document = Mock()
        sub2.submitted_document.folder = "management_plans"

        mock_sub_model.query.filter_by.return_value.filter.return_value \
            .order_by.return_value.all.return_value = [sub1, sub2]

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=10, folder="management_plans"
        )

        assert result is None

    @patch(f"{MODULE_PATH}.ItemModel")
    def test_returns_none_when_item_not_found(self, mock_item_model):
        """Non-existent item returns None."""
        mock_item_model.find_by_id.return_value = None

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=999, folder="management_plans"
        )

        assert result is None

    @patch(f"{MODULE_PATH}.ItemModel")
    @patch(f"{MODULE_PATH}.PackageVersionModel")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_returns_none_when_no_matching_item_on_previous_package(
        self, mock_find_package, mock_pv_model, mock_item_model,
        mock_item, mock_package_version_2
    ):
        """No matching item by type_id on previous package returns None."""
        mock_item_model.find_by_id.return_value = mock_item
        mock_find_package.return_value = mock_package_version_2

        mock_prev_version = Mock()
        mock_prev_version.package = Mock()
        mock_prev_version.package.id = 80
        mock_pv_model.query.filter_by.return_value.first.return_value = mock_prev_version

        mock_item_model.query.filter_by.return_value.first.return_value = None

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=10, folder="management_plans"
        )

        assert result is None

    @patch(f"{MODULE_PATH}.SubmissionModel")
    @patch(f"{MODULE_PATH}.ItemModel")
    @patch(f"{MODULE_PATH}.PackageVersionModel")
    @patch(f"{MODULE_PATH}.PackageModel.find_by_id")
    def test_links_single_submission_without_folder_match(
        self, mock_find_package, mock_pv_model, mock_item_model, mock_sub_model,
        mock_item, mock_package_version_2, mock_previous_item, mock_previous_submission
    ):
        """Single previous submission links even if folder doesn't match (fallback)."""
        mock_item_model.find_by_id.return_value = mock_item
        mock_find_package.return_value = mock_package_version_2

        mock_prev_version = Mock()
        mock_prev_version.package = Mock()
        mock_prev_version.package.id = 80
        mock_pv_model.query.filter_by.return_value.first.return_value = mock_prev_version

        mock_item_model.query.filter_by.return_value.first.return_value = mock_previous_item

        # Previous submission is in a different folder
        mock_previous_submission.submitted_document.folder = "consultation_records"

        mock_sub_model.query.filter_by.return_value.filter.return_value \
            .order_by.return_value.all.return_value = [mock_previous_submission]

        result = DocumentSubmissionCreator._resolve_root_submission_id_from_previous_version(
            item_id=10, folder="management_plans"
        )

        # Falls through folder matching (no match), but single submission links
        assert result == 110



