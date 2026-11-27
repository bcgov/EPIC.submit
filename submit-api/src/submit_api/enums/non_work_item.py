"""Non-work item type enum.

Manages non-work submission item types like Management Plans and Reports.
"""
from __future__ import annotations

import enum


class NonWorkItemType(enum.Enum):
    """Enum for non-work submission item types."""

    MANAGEMENT_PLAN = 'MANAGEMENT_PLAN'
    REPORT = 'REPORT'


class NonWorkItemEligibility(enum.Enum):
    """Rule deciding whether a project is eligible for a non-work item type."""

    APPROVED_CONDITION = 'APPROVED_CONDITION'  # project.has_approved_condition is true
    ALWAYS = 'ALWAYS'
