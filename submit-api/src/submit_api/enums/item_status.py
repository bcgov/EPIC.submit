"""Submission item status class.

Manages the item status
"""
from __future__ import annotations

import enum


class ItemStatus(enum.Enum):
    """Enum for item statuses."""

    NEW_SUBMISSION = 'NEW_SUBMISSION'
    PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED'
    COMPLETED = 'COMPLETED'
    SUBMITTED = 'SUBMITTED'


def is_completion_status(status):
    """Check if the status is a completion status."""
    completion_statuses = [ItemStatus.COMPLETED.value, ItemStatus.SUBMITTED.value,
                           ItemStatus.PARTIALLY_COMPLETED.value, ItemStatus.NEW_SUBMISSION.value]
    return status in completion_statuses
