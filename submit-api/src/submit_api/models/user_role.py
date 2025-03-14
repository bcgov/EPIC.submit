"""Mode for user role."""
from __future__ import annotations

from sqlalchemy import Column, Integer, ForeignKey, ARRAY

from .base_model import BaseModel
from .db import db


class UserRole(BaseModel):
    """Table to manage user role assignments."""

    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_user_id = Column(Integer, ForeignKey("account_users.id"), nullable=False)
    account_project_id = Column(Integer, ForeignKey("account_projects.id"),
                                nullable=True)  # NULL for account-wide roles
    package_ids = Column(ARRAY(Integer), nullable=True)  # NULL for project-wide roles
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    role = db.relationship("Role", lazy="joined")
    account_user = db.relationship("AccountUser", back_populates="role", lazy="select")

    def to_dict(self):
        """Convert object to dictionary."""
        return {
            "id": self.id,
            "account_user_id": self.account_user_id,
            "account_project_id": self.account_project_id,
            "package_ids": self.package_ids,
            "role_id": self.role_id,
            "role": self.role.to_dict(),
        }

    @classmethod
    def create_user_role(cls, data, session=None) -> UserRole:
        """Create a user role assignment."""
        user_role = UserRole(
            account_user_id=data.get("account_user_id"),
            account_project_id=data.get("account_project_id"),
            package_ids=data.get("package_ids") or None,
            role_id=data.get("role_id"),
        )
        if session:
            session.add(user_role)
            session.flush()
        else:
            user_role.save()
        return user_role

    @classmethod
    def get_role_by_account_user_id(cls, account_user_id):
        """Get the user for a given account."""
        return cls.query.filter(cls.account_user_id == account_user_id).first()
