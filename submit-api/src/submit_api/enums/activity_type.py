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

    SUBMITTED_TO_EAO = "Submitted to EAO"
    UPDATED_SUBMISSION = "Updated Submission"
    START_CONSULTATION_CHECK = "Start Consultation Check"
    UPDATE_REQUESTED = "Update Requested"
    PASSED_CONSULTATION_CHECK = "Passed Consultation Check"
    FAILED_CONSULTATION_CHECK = "Failed Consultation Check"
    START_MP_REVIEW = "Start MP Review"
    MP_APPROVED = "MP Approved"
    MP_ACCEPTED = "MP Accepted"
    MP_SATISFIED = "MP Satisfied"
    MP_REVIEWED = "MP Reviewed"
    MP_REVIEW_REJECTED = "MP Review Rejected"
    MP_REVIEW_FAILED = "MP Review Failed"
    REVISION_REQUIRED = "Revision Required"
    REVISION_REQUESTED = "Revision Requested"
    START_IEM_REVIEW = "Start IEM Review"
    IEM_APPROVED = "IEM Approved"
    IEM_ACCEPTED = "IEM Accepted"
    IEM_SATISFIED = "IEM Satisfied"
    IEM_REVIEW_REJECTED = "IEM Review Rejected"
    IEM_REVIEW_FAILED = "IEM Review Failed"
    IEM_REVIEWED = "IEM Reviewed"
    RESUBMISSION_INVITATION = "Resubmission Invitation"
