"""Proponent status class."""
from __future__ import annotations

import enum


class ProponentStatus(enum.Enum):
    """Enum for proponent statuses."""

    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"
    PENDING_ONBOARDING = "PENDING_ONBOARDING"
    ONBOARDED = "ONBOARDED"
