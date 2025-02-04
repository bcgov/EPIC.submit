"""Submission item status class.

Manages the item status
"""
from __future__ import annotations

import enum


class ActivityTypeEnum(enum.Enum):
    """Enum for activity type statuses."""

    SUBMISSION = 'SUBMISSION'
    USER = 'USER'


class ActorTypeEnum(enum.Enum):
    """Enum for activity type statuses."""

    USER = 'USER'
    STAFF = "STAFF"


class VisibilityTypeEnum(enum.Enum):
    """Enum for defining who can see a logged activity."""

    STAFF = "STAFF"
    PUBLIC = "PUBLIC"


class ActivityActionType(enum.Enum):
    """Enum for activity type statuses."""

    ORIGINAL_SUBMISSION = "Original Submission"
    START_CONSULTATION_CHECK = "Start Consultation Check"
    UPDATED_SUBMISSION_UPDATE_REQUESTED = "Updated Submission (Update Requested)"
    PASSED_CONSULTATION_CHECK = "Passed Consultation Check"
    FAILED_CONSULTATION_CHECK = "Failed Consultation Check"
    START_MP_REVIEW = "Start MP Review"
    MP_APPROVED = "MP Accepted/Approved/Satisfied"
    MP_REVIEW_REJECTED = "MP Review Rejected"
    UPDATED_SUBMISSION_REVISION_REQUIRED = "Updated Submission (Revision Required)"
