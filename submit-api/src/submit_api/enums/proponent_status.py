"""Proponent status class."""
from __future__ import annotations

import enum


class ProponentStatus(enum.Enum):
    """Enum for proponent statuses."""

    ELIGIBLE = "Eligible"
    INELIGIBLE = "Ineligible"
    PENDING_ONBOARDING = "Pending Onboarding"
    ONBOARDED = "Onboarded"

