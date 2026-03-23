"""Model for terms of service."""
from __future__ import annotations

from sqlalchemy import Column, Integer, Text

from .base_model import BaseModel
from .db import db


class TermsOfService(BaseModel):
    """Table to manage terms of service."""

    __tablename__ = "account_terms_of_service"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(db.Integer(), nullable=False, unique=True)
    content = Column(Text(), nullable=False)
    rich_content = Column(db.JSON, nullable=True)
    active = Column(db.Boolean, nullable=False, default=True)

    @classmethod
    def create_terms_of_service(cls, data, session=None) -> TermsOfService:
        """Create a new Terms of service record."""
        # Deactivate all existing records
        if session:
            session.query(cls).filter_by(active=True).update({"active": False})
        else:
            cls.query.filter_by(active=True).update({"active": False})
            db.session.flush()

        active = data.get("active")
        terms_of_service = TermsOfService(
            version=data.get("version"),
            content=data.get("content"),
            rich_content=data.get("rich_content"),
            active=True if active is None else active,
        )
        return terms_of_service.persist(session)

    @classmethod
    def get_active_terms_of_service(cls) -> TermsOfService | None:
        """Get the currently active terms of service."""
        return cls.query.filter_by(active=True).first()

    @classmethod
    def get_active_terms_of_service_by_version(cls, terms_of_service_version_id) -> TermsOfService | None:
        """Get the currently active terms of service."""
        return cls.query.filter_by(version=terms_of_service_version_id, active=True).first()
