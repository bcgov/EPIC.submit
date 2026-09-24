"""Banner configuration model class.

Manages dynamically configurable welcome-page banners. Only one banner may be
active at a time; the service layer enforces that invariant.
"""
from __future__ import annotations

from sqlalchemy import Column, Enum

from .base_model import BaseModel
from .db import db
from ..enums.banner import BannerType


class BannerConfiguration(BaseModel):
    """Definition of the banner configuration entity."""

    __tablename__ = 'banner_configurations'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    banner_type = Column(Enum(BannerType), nullable=False)
    content = Column(
        db.Text, nullable=False,
        comment="Rich-text HTML content authored via the staff editor"
    )
    is_active = Column(
        db.Boolean, nullable=False, default=False,
        comment="Whether this banner is the single active banner"
    )

    @classmethod
    def get_active(cls):
        """Return the most recently updated active banner, if any."""
        return (
            cls.query
            .filter_by(is_active=True)
            .order_by(cls.updated_date.desc(), cls.id.desc())
            .first()
        )

    @classmethod
    def create_banner(cls, data, session=None) -> BannerConfiguration:
        """Create a banner configuration."""
        banner = BannerConfiguration(
            banner_type=data.get('banner_type', None),
            content=data.get('content', None),
            is_active=data.get('is_active', False),
        )
        return banner.persist(session)

    @classmethod
    def deactivate_all(cls, exclude_id=None) -> None:
        """Deactivate every banner, optionally excluding one id."""
        query = cls.query.filter_by(is_active=True)
        if exclude_id is not None:
            query = query.filter(cls.id != exclude_id)
        query.update({cls.is_active: False}, synchronize_session=False)
