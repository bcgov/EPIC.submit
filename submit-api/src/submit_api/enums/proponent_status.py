"""Proponent status class."""
from __future__ import annotations

import enum


class ProponentStatus(enum.Enum):
    """Enum for proponent statuses."""

    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"
    INVITE_GENERATED = "INVITE_GENERATED"
    PENDING_ONBOARDING = "PENDING_ONBOARDING"
    ONBOARDED = "ONBOARDED"
