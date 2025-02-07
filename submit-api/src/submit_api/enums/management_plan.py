"""Enums for management plan."""
from __future__ import annotations

import enum


class ManagementPlanSubmissionPurpose(enum.Enum):
    """Enum for management plan submission purposes."""

    ACCEPTANCE = 'Acceptance'
    APPROVAL = 'Approval'
    SATISFACTION = 'Satisfaction'
