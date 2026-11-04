"""Submission package type class.

Manages the package types
"""
from __future__ import annotations

import enum


class PackageTypeEnum(enum.Enum):
    """Enum for package types."""

    MANAGEMENT_PLAN = 'Management Plan'
    IEM = 'IEM'
    ADDITIONAL_INFORMATION = 'Additional Information'
    REPORT = 'Report'
    REPORT_TYPE_B = 'Report_TypeB'


class PackageTypeId(enum.Enum):
    """Enum for package type IDs."""

    MANAGEMENT_PLAN = 1
    IEM = 2


class PackageApprovalType(enum.Enum):
    """Enum for package approval types."""

    A = 'A'
    B = 'B'
    C = 'C'


MANAGEMENT_PLAN_RELATED_TYPES = frozenset(
    {PackageTypeEnum.MANAGEMENT_PLAN.value, PackageTypeEnum.IEM.value}
)

# Report-style package types. Report_TypeB is a clone of Report that adds an
# Acknowledge step (approval_type B); both share the same report submission flow.
REPORT_RELATED_TYPES = frozenset(
    {PackageTypeEnum.REPORT.value, PackageTypeEnum.REPORT_TYPE_B.value}
)

# Condition API report types that map to the Report_TypeB package type (which
# surfaces the Acknowledge step) instead of the regular Report package type.
COMPLIANCE_SELF_REPORT = 'Compliance Self-Report'
REPORT_TYPE_B_SOURCE_REPORT_TYPES = frozenset({COMPLIANCE_SELF_REPORT})


def resolve_report_package_type(report_type: str | None) -> PackageTypeEnum:
    """Return the package type to use for a synced report obligation.

    Compliance Self-Report obligations use the Report_TypeB package type; all
    other report types use the regular Report package type.
    """
    if report_type in REPORT_TYPE_B_SOURCE_REPORT_TYPES:
        return PackageTypeEnum.REPORT_TYPE_B
    return PackageTypeEnum.REPORT
