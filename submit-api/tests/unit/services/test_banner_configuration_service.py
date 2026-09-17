"""Unit tests for BannerConfigurationService single-active enforcement."""
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.banner import BannerType
from submit_api.exceptions import ResourceNotFoundError
from submit_api.services.banner_configuration_service import BannerConfigurationService


MODULE_PATH = "submit_api.services.banner_configuration_service"


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Provide a logger so the service can log without an app context."""
    with patch(f"{MODULE_PATH}.current_app", new=Mock()) as mock_app:
        yield mock_app


class TestBannerConfigurationCreate:
    """Tests for BannerConfigurationService.create."""

    @patch(f"{MODULE_PATH}.db")
    @patch(f"{MODULE_PATH}.BannerConfiguration")
    def test_create_active_deactivates_others(self, mock_model, mock_db):
        """Creating an active banner deactivates all existing banners first."""
        created = Mock()
        created.id = 5
        mock_model.create_banner.return_value = created

        data = {
            "banner_type": BannerType.INFO,
            "content": "<p>Hello</p>",
            "is_active": True,
        }
        result = BannerConfigurationService.create(data)

        mock_model.deactivate_all.assert_called_once_with()
        mock_model.create_banner.assert_called_once()
        mock_db.session.commit.assert_called_once()
        assert result is created

    @patch(f"{MODULE_PATH}.db")
    @patch(f"{MODULE_PATH}.BannerConfiguration")
    def test_create_inactive_does_not_deactivate(self, mock_model, mock_db):
        """Creating an inactive banner leaves other banners untouched."""
        mock_model.create_banner.return_value = Mock(id=6)

        data = {
            "banner_type": BannerType.WARNING,
            "content": "<p>Later</p>",
            "is_active": False,
        }
        BannerConfigurationService.create(data)

        mock_model.deactivate_all.assert_not_called()
        mock_db.session.commit.assert_called_once()


class TestBannerConfigurationUpdate:
    """Tests for BannerConfigurationService.update."""

    @patch(f"{MODULE_PATH}.db")
    @patch(f"{MODULE_PATH}.BannerConfiguration")
    def test_update_activating_deactivates_others(self, mock_model, mock_db):
        """Updating a banner to active deactivates every other banner."""
        banner = Mock()
        banner.id = 3
        mock_model.find_by_id.return_value = banner

        result = BannerConfigurationService.update(3, {"is_active": True})

        mock_model.deactivate_all.assert_called_once_with(exclude_id=3)
        assert banner.is_active is True
        mock_db.session.commit.assert_called_once()
        assert result is banner

    @patch(f"{MODULE_PATH}.db")
    @patch(f"{MODULE_PATH}.BannerConfiguration")
    def test_update_content_and_type(self, mock_model, mock_db):
        """Updating content and type mutates the banner without deactivating."""
        banner = Mock()
        banner.id = 9
        mock_model.find_by_id.return_value = banner

        BannerConfigurationService.update(
            9, {"banner_type": BannerType.SUCCESS, "content": "<p>New</p>"}
        )

        assert banner.banner_type == BannerType.SUCCESS
        assert banner.content == "<p>New</p>"
        mock_model.deactivate_all.assert_not_called()
        mock_db.session.commit.assert_called_once()

    @patch(f"{MODULE_PATH}.db")
    @patch(f"{MODULE_PATH}.BannerConfiguration")
    def test_update_missing_banner_raises_not_found(self, mock_model, mock_db):
        """Updating a non-existent banner raises ResourceNotFoundError."""
        mock_model.find_by_id.return_value = None

        with pytest.raises(ResourceNotFoundError):
            BannerConfigurationService.update(404, {"content": "<p>x</p>"})

        mock_db.session.commit.assert_not_called()


class TestBannerConfigurationGetActive:
    """Tests for BannerConfigurationService.get_active."""

    @patch(f"{MODULE_PATH}.BannerConfiguration")
    def test_get_active_delegates_to_model(self, mock_model):
        """get_active returns whatever the model reports as active."""
        active = Mock()
        mock_model.get_active.return_value = active

        assert BannerConfigurationService.get_active() is active
        mock_model.get_active.assert_called_once_with()
