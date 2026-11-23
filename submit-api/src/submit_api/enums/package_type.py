"""Submission package type class.

Manages the package types
"""
import enum


class PackageTypeEnum(enum.Enum):
    """Enum for package types."""

    MANAGEMENT_PLAN = 'Management Plan'
    IEM = 'IEM'
    ADDITIONAL_INFORMATION = 'Additional Information'
    REPORT = 'Report'


class PackageTypeId(enum.Enum):
    """Enum for package type IDs."""

    MANAGEMENT_PLAN = 1
    IEM = 2


class PackageApprovalType(enum.Enum):
    """Enum for package approval types."""

    A = 'A'
    B = 'B'
    C = 'C'


# Package statuses that mean a package is done. A package with one of these (and not still awaiting
# approval) can be archived once its work has moved past the package type's phase range.
FINISHED_PACKAGE_STATUS_NAMES = frozenset({
    'APPROVED', 'ACCEPTED', 'SATISFIED', 'REVIEWED', 'NOT_APPROVED',
    'ACKNOWLEDGED', 'PROVIDED', 'WITHDRAWN', 'COMPLETED',
})

# A Type C package is ACKNOWLEDGED while still awaiting approval, so it is not finished yet.
AWAITING_APPROVAL_STATUS_NAME = 'READY_FOR_APPROVAL'

MANAGEMENT_PLAN_RELATED_TYPES = frozenset(
    {PackageTypeEnum.MANAGEMENT_PLAN.value, PackageTypeEnum.IEM.value}
)

# Report-style package types: they share the report submission flow.
REPORT_RELATED_TYPES = frozenset({PackageTypeEnum.REPORT.value})
