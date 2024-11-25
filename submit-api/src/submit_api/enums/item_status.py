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
