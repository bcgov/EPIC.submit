"""Service for banner configuration management.

Enforces the invariant that at most one banner configuration is active at a
time. Creating or updating a banner as active deactivates every other banner
within the same transaction.
"""
from flask import current_app

from submit_api.exceptions import ResourceNotFoundError
from submit_api.models import db
from submit_api.models.banner_configuration import BannerConfiguration


class BannerConfigurationService:
    """Banner configuration management service."""

    @classmethod
    def get_active(cls):
        """Return the single active banner configuration, or None."""
        return BannerConfiguration.get_active()

    @classmethod
    def create(cls, data) -> BannerConfiguration:
        """Create a banner configuration, enforcing a single active banner."""
        is_active = bool(data.get('is_active', False))
        if is_active:
            BannerConfiguration.deactivate_all()

        banner = BannerConfiguration.create_banner(
            {
                'banner_type': data.get('banner_type'),
                'content': data.get('content'),
                'is_active': is_active,
            }
        )
        db.session.commit()
        current_app.logger.info(f"Created banner configuration {banner.id}")
        return banner

    @classmethod
    def update(cls, banner_id, data) -> BannerConfiguration:
        """Update a banner configuration, enforcing a single active banner."""
        banner = BannerConfiguration.find_by_id(banner_id)
        if not banner:
            current_app.logger.warning(f"Banner configuration {banner_id} not found.")
            raise ResourceNotFoundError(f"Banner configuration with id {banner_id} not found.")

        if 'banner_type' in data:
            banner.banner_type = data.get('banner_type')
        if 'content' in data:
            banner.content = data.get('content')

        if 'is_active' in data:
            is_active = bool(data.get('is_active'))
            if is_active:
                BannerConfiguration.deactivate_all(exclude_id=banner.id)
            banner.is_active = is_active

        db.session.add(banner)
        db.session.commit()
        current_app.logger.info(f"Updated banner configuration {banner.id}")
        return banner
