"""Enums for role actions"""
from __future__ import annotations

import enum


class RoleEnum(enum.Enum):
    """Enum for Role types"""

    ACCOUNT_PRIMARY_ADMIN = 'ACCOUNT_PRIMARY_ADMIN'
    PROJECT_ADMIN = 'PROJECT_ADMIN'
    SUBMISSION_ADMIN = 'SUBMISSION_ADMIN'
    SPECIFIC_SUBMISSION_CONTRIBUTOR = 'SPECIFIC_SUBMISSION_CONTRIBUTOR'


class ProponentPermissionsEnum(enum.Enum):
    """Enum for role actions."""

    CREATE_PACKAGE = 'CREATE_PACKAGE'
    SUBMIT_PACKAGE = 'SUBMIT_PACKAGE'
    INVITE_USERS = 'INVITE_USERS'
