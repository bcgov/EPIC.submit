"""Unit tests for ManagementPlanService."""
from unittest.mock import Mock, patch, MagicMock

import pytest

MODULE = "submit_api.services.management_plan_service"


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Patch current_app so the service's logger calls work without an app context."""
    with patch(f"{MODULE}.current_app", new=Mock()):
        yield


def _mock_item(package_id=1, item_id=10):
    """Build a mock item."""
    item = Mock()
    item.id = item_id
    item.package_id = package_id
    item.type = Mock()
    item.type.name = "MANAGEMENT_PLAN_FORM"
    return item


def _mock_package(package_id=1):
    """Build a mock package with version info."""
    package = Mock()
    package.id = package_id
    package.version = Mock()
    package.version.original_package_id = 100
    package.version.version = 2
    package.version_id = 1
    package.enforceable = False
    package.update_requests = []
    return package


class TestRequireRevisionManagementPlan:
    """Tests for require_revision_management_plan."""

    @patch(f"{MODULE}.PackageVersionService")
    @patch(f"{MODULE}.PackageVersion")
    @patch(f"{MODULE}.PackageModel")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    @patch(f"{MODULE}.UpdateRequest")
    def test_does_not_create_update_request(
        self,
        mock_update_request_cls,
        mock_package_metadata,
        mock_activity_log,
        mock_package_model,
        mock_package_version,
        mock_pkg_version_service,
    ):
        """Revision required should NOT create an update request (no item types specified)."""
        from submit_api.services.management_plan_service import ManagementPlanService

        item = _mock_item()
        session = MagicMock()

        package = _mock_package()
        mock_package_model.find_by_id.return_value = package

        mock_package_version.get_by_id.return_value = Mock()

        new_item = _mock_item(package_id=2, item_id=20)
        new_package = Mock()
        new_package.id = 2
        new_package.name = "new_package"
        new_package.items = [new_item]
        mock_pkg_version_service.create_new_package_version.return_value = new_package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_package_metadata.get_or_create.return_value = mock_metadata

        mock_package_version.get_all_by_original_package_id.return_value = []

        ManagementPlanService.require_revision_management_plan(item, session)

        # UpdateRequest should NOT be instantiated
        mock_update_request_cls.assert_not_called()

    @patch(f"{MODULE}.PackageVersionService")
    @patch(f"{MODULE}.PackageVersion")
    @patch(f"{MODULE}.PackageModel")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    @patch(f"{MODULE}.UpdateRequest")
    def test_makes_all_versions_not_enforceable_and_current_enforceable(
        self,
        mock_update_request_cls,
        mock_package_metadata,
        mock_activity_log,
        mock_package_model,
        mock_package_version,
        mock_pkg_version_service,
    ):
        """Require revision should mark all versions not enforceable, then mark current enforceable."""
        from submit_api.services.management_plan_service import ManagementPlanService

        item = _mock_item()
        session = MagicMock()

        package = _mock_package()
        mock_package_model.find_by_id.return_value = package

        mock_package_version.get_by_id.return_value = Mock()

        new_item = _mock_item(package_id=2, item_id=20)
        new_package = Mock()
        new_package.id = 2
        new_package.name = "new_package"
        new_package.items = [new_item]
        mock_pkg_version_service.create_new_package_version.return_value = new_package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_package_metadata.get_or_create.return_value = mock_metadata

        # Set up package versions with enforceable packages
        pv1 = Mock()
        pv1.package = Mock(enforceable=True)
        pv2 = Mock()
        pv2.package = Mock(enforceable=True)
        mock_package_version.get_all_by_original_package_id.return_value = [pv1, pv2]

        ManagementPlanService.require_revision_management_plan(item, session)

        assert pv1.package.enforceable is False
        assert pv2.package.enforceable is False
        assert package.enforceable is True

    @patch(f"{MODULE}.PackageVersionService")
    @patch(f"{MODULE}.PackageVersion")
    @patch(f"{MODULE}.PackageModel")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    @patch(f"{MODULE}.UpdateRequest")
    def test_deactivates_old_update_requests(
        self,
        mock_update_request_cls,
        mock_package_metadata,
        mock_activity_log,
        mock_package_model,
        mock_package_version,
        mock_pkg_version_service,
    ):
        """Require revision should deactivate existing update requests on the old package."""
        from submit_api.services.management_plan_service import ManagementPlanService

        item = _mock_item()
        session = MagicMock()

        package = _mock_package()
        mock_package_model.find_by_id.return_value = package

        mock_package_version.get_by_id.return_value = Mock()

        new_item = _mock_item(package_id=2, item_id=20)
        new_package = Mock()
        new_package.id = 2
        new_package.name = "new_package"
        new_package.items = [new_item]
        mock_pkg_version_service.create_new_package_version.return_value = new_package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_package_metadata.get_or_create.return_value = mock_metadata
        mock_package_version.get_all_by_original_package_id.return_value = []

        ManagementPlanService.require_revision_management_plan(item, session)

        # Verify deactivate_update_requests was called on the OLD package_id
        mock_pkg_version_service.deactivate_update_requests.assert_called_once_with(
            item.package_id, session, None
        )


class TestRejectManagementPlanForm:
    """Tests for reject_management_plan_form."""

    @patch(f"{MODULE}.PackageVersionService")
    @patch(f"{MODULE}.PackageVersion")
    @patch(f"{MODULE}.PackageModel")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    @patch(f"{MODULE}.UpdateRequest")
    def test_reject_does_not_create_update_request(
        self,
        mock_update_request_cls,
        mock_package_metadata,
        mock_activity_log,
        mock_package_model,
        mock_package_version,
        mock_pkg_version_service,
    ):
        """Reject should NOT create an update request on the new package."""
        from submit_api.services.management_plan_service import ManagementPlanService

        item = _mock_item()
        session = MagicMock()

        package = _mock_package()
        mock_package_model.find_by_id.return_value = package

        mock_package_version.get_by_id.return_value = Mock()

        new_item = _mock_item(package_id=2, item_id=20)
        new_package = Mock()
        new_package.id = 2
        new_package.name = "new_package"
        new_package.items = [new_item]
        mock_pkg_version_service.create_new_package_version.return_value = new_package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_package_metadata.get_or_create.return_value = mock_metadata

        ManagementPlanService.reject_management_plan_form(item, session)

        # UpdateRequest should NOT be instantiated
        mock_update_request_cls.assert_not_called()

    @patch(f"{MODULE}.PackageVersionService")
    @patch(f"{MODULE}.PackageVersion")
    @patch(f"{MODULE}.PackageModel")
    @patch(f"{MODULE}.ActivityLogService")
    @patch(f"{MODULE}.PackageMetadata")
    def test_reject_sets_revision_required_on_new_package(
        self,
        mock_package_metadata,
        mock_activity_log,
        mock_package_model,
        mock_package_version,
        mock_pkg_version_service,
    ):
        """Reject should set REVISION_REQUIRED status on the new package."""
        from submit_api.services.management_plan_service import ManagementPlanService
        from submit_api.models.package import PackageStatus

        item = _mock_item()
        session = MagicMock()

        package = _mock_package()
        mock_package_model.find_by_id.return_value = package

        mock_package_version.get_by_id.return_value = Mock()

        new_item = _mock_item(package_id=2, item_id=20)
        new_package = Mock()
        new_package.id = 2
        new_package.name = "new_package"
        new_package.items = [new_item]
        mock_pkg_version_service.create_new_package_version.return_value = new_package

        mock_metadata = Mock()
        mock_metadata.json = {}
        mock_package_metadata.get_or_create.return_value = mock_metadata

        ManagementPlanService.reject_management_plan_form(item, session)

        assert new_package.status == [PackageStatus.REVISION_REQUIRED.value]


class TestCreateNewPackageVersion:
    """Tests for create_new_package_version."""

    @patch(f"{MODULE}.PackageVersionService")
    @patch(f"{MODULE}.PackageVersion")
    @patch(f"{MODULE}.PackageModel")
    def test_sets_revision_required_status_on_new_package(
        self,
        mock_package_model,
        mock_package_version,
        mock_pkg_version_service,
    ):
        """New package version should have REVISION_REQUIRED status."""
        from submit_api.services.management_plan_service import ManagementPlanService
        from submit_api.models.package import PackageStatus

        item = _mock_item()
        session = MagicMock()

        package = _mock_package()
        mock_package_model.find_by_id.return_value = package

        mock_package_version.get_by_id.return_value = Mock()

        new_item = _mock_item(package_id=2, item_id=20)
        new_package = Mock()
        new_package.id = 2
        new_package.name = "new_package"
        new_package.items = [new_item]
        mock_pkg_version_service.create_new_package_version.return_value = new_package

        result_package, result_item = ManagementPlanService.create_new_package_version(
            item, session
        )

        assert result_package.status == [PackageStatus.REVISION_REQUIRED.value]
        assert result_item == new_item
