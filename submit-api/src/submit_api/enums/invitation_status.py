"""Invitation status class."""
from __future__ import annotations

import enum


class InvitationStatus(enum.Enum):
    """Enum for invitation statuses."""

    PENDING = "pending"
    REVOKED = "revoked"
    USED = "used"
