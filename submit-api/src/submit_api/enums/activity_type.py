"""Submission item status class.

Manages the item status
"""
from __future__ import annotations

import enum


class ActivityTypeEnum(enum.Enum):
    """Enum for activity type statuses."""

    SUBMISSION = 'SUBMISSION'
    USER = 'USER'
    PACKAGE = 'PACKAGE'


class ActorTypeEnum(enum.Enum):
    """Enum for activity type statuses."""

    ENTITY = 'ENTITY'
    STAFF = "STAFF"


class VisibilityTypeEnum(enum.Enum):
    """Enum for defining who can see a logged activity."""

    STAFF = "STAFF"
    PUBLIC = "PUBLIC"


class ActivityActionType(enum.Enum):
    """Enum for activity type statuses."""

    ORIGINAL_SUBMISSION = "Original Submission"
    START_CONSULTATION_CHECK = "Start Consultation Check"
    UPDATE_REQUESTED = "Update Requested"
    PASSED_CONSULTATION_CHECK = "Passed Consultation Check"
    FAILED_CONSULTATION_CHECK = "Failed Consultation Check"
    START_MP_REVIEW = "Start MP Review"
    MP_APPROVED = "MP Approved"
    MP_ACCEPTED = "MP Accepted"
    MP_SATISFIED = "MP Satisfied"
    MP_REVIEW_REJECTED = "MP Review Rejected"
    REVISION_REQUIRED = "Revision Required"
