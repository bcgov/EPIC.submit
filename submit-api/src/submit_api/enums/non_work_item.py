"""Non-work item type enum.

Manages non-work submission item types like Management Plans and Reports.
"""
from __future__ import annotations

import enum


class NonWorkItemType(enum.Enum):
    """Enum for non-work submission item types."""

    MANAGEMENT_PLAN = 'MANAGEMENT_PLAN'
    REPORT = 'REPORT'
