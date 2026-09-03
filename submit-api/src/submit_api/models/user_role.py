"""Mode for user role."""
from __future__ import annotations

from datetime import datetime, UTC

from sqlalchemy import Column, Integer, ForeignKey, ARRAY

from .base_model import BaseModel
from .db import db
from ..enums.role import ProponentPermissionsEnum, RoleEnum


class UserRole(BaseModel):
    """Table to manage user role assignments."""

    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_user_id = Column(Integer, ForeignKey("account_users.id", ondelete='CASCADE'), nullable=False)
    account_project_id = Column(Integer, ForeignKey("account_projects.id", ondelete='CASCADE'),
                                nullable=True)  # NULL for account-wide roles
    package_ids = Column(ARRAY(Integer), nullable=True)  # NULL for project-wide roles
    original_package_ids = Column(ARRAY(Integer), nullable=True)  # For original package IDs
    active = Column(db.Boolean, nullable=False, default=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    access_start = Column(db.DateTime, default=lambda: datetime.now(UTC), nullable=False)
    access_end = Column(db.DateTime, nullable=True)  # NULL means ongoing/open-ended
    role = db.relationship("Role", lazy="joined")
    account_user = db.relationship("AccountUser", back_populates="roles", lazy="select")

    @property
    def permissions(self):
        """Get permissions for the role."""
        return self.get_permissions_from_role(str(self.role.role_name))

    @staticmethod
    def get_permissions_from_role(role: str) -> list[ProponentPermissionsEnum]:
        """Get permissions from role."""
        permissions_map = {
            RoleEnum.ACCOUNT_PRIMARY_ADMIN.value: [
                ProponentPermissionsEnum.CREATE_PACKAGE.value,
                ProponentPermissionsEnum.SUBMIT_PACKAGE.value,
                ProponentPermissionsEnum.INVITE_USERS.value,
                ProponentPermissionsEnum.VIEW_ALL_DOCUMENTS.value
            ],
            RoleEnum.PROJECT_ADMIN.value: [
                ProponentPermissionsEnum.CREATE_PACKAGE.value,
                ProponentPermissionsEnum.SUBMIT_PACKAGE.value,
                ProponentPermissionsEnum.INVITE_USERS.value,
                ProponentPermissionsEnum.VIEW_ALL_DOCUMENTS.value
            ],
            RoleEnum.SUBMISSION_ADMIN.value: [],
            RoleEnum.SPECIFIC_SUBMISSION_CONTRIBUTOR.value: []
        }
        if role in permissions_map:
            return permissions_map[role]
        return []

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "account_user_id": self.account_user_id,
            "account_project_id": self.account_project_id,
            "package_ids": self.package_ids,
            "original_package_ids": self.original_package_ids,
            "role_id": self.role_id,
            "role": self.role.to_dict(),
            "permissions": self.permissions,
            "active": self.active,
            "access_start": self.access_start.isoformat() if self.access_start else None,
            "access_end": self.access_end.isoformat() if self.access_end else None,
        }

    @classmethod
    def create_user_role(cls, data, session=None) -> UserRole:
        """Create a user role assignment."""
        user_role = UserRole(
            account_user_id=data.get("account_user_id"),
            account_project_id=data.get("account_project_id"),
            package_ids=data.get("package_ids") or None,
            original_package_ids=data.get("original_package_ids") or None,
            role_id=data.get("role_id"),
        )
        return user_role.persist(session)

    @classmethod
    def get_all_in_user_ids(cls, account_user_ids: list) -> list:
        """Get all user roles for the given account user ids."""
        return cls.query.filter(cls.account_user_id.in_(account_user_ids)).all()

    @classmethod
    def get_role_by_account_user_id(cls, account_user_id):
        """Get the first active user role for a given account user."""
        return cls.query.filter(
            cls.account_user_id == account_user_id,
            cls.active.is_(True)
        ).first()

    @classmethod
    def get_all_by_account_user_id(cls, account_user_id):
        """Get all active user roles for a given account user."""
        return cls.query.filter(
            cls.account_user_id == account_user_id,
            cls.active.is_(True)
        ).all()

    @classmethod
    def get_access_history_by_account_user_id(cls, account_user_id):
        """Get full access history (active and inactive) for a given account user."""
        return cls.query.filter(
            cls.account_user_id == account_user_id
        ).order_by(cls.access_start.desc()).all()

    @classmethod
    def delete_all_by_account_user_id(cls, account_user_id):
        """Soft-delete all active user roles: set access_end and mark inactive."""
        now = datetime.now(UTC)
        active_roles = cls.query.filter(
            cls.account_user_id == account_user_id,
            cls.active.is_(True)
        ).all()
        for role in active_roles:
            role.active = False
            role.access_end = now
