"""User Status model class.

Manages the User status
"""

from enum import IntEnum
from .base_model import BaseModel
from .db import db


class UserStatusEnum(IntEnum):
    """User status."""

    ACTIVE = 1
    INACTIVE = 2
    ACCESS_REVOKED = 3


class UserStatus(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the User Status entity."""

    __tablename__ = 'user_status'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    status_name = db.Column(db.String(50))
    description = db.Column(db.String(50))
    users = db.relationship('User', back_populates='user_status', cascade='all, delete')
