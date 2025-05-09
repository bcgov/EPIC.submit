"""Submission package type class.

Manages the package types
"""
from __future__ import annotations

import enum


class PackageTypeEnum(enum.Enum):
    """Enum for package types."""

    MANAGEMENT_PLAN = 'Management Plan'
    IEM = 'IEM'
