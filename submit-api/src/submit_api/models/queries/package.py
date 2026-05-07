# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Model to handle all complex operations related to Package."""
from sqlalchemy import func
from submit_api.enums.item_status import ItemStatus
from submit_api.enums.package_type import PackageApprovalType
from submit_api.models import AccountProject, db
from submit_api.models.package import Package as PackageModel
from submit_api.models.package import PackageStatus
from submit_api.models.package_version import PackageVersion
from submit_api.models.package_item_type import PackageItemType
from submit_api.models.submission import SubmissionStatus, SubmissionType
from submit_api.models.update_request import UpdateRequestStatus


# pylint: disable=too-few-public-methods
class PackageQueries:
    """Query module for complex package queries"""

    @classmethod
    def get_latest_account_project_packages(cls, account_id: int, account_project_ids: int = None):
        """Fetch project_id and related packages (id, name) for a given account_id.

        Only includes packages with the latest version_id matching the highest version
        of the original_package_id from package_versions.
        """
        # Subquery to get the latest version_id for each original_package_id
        latest_versions_subquery = (
            db.session.query(
                PackageVersion.original_package_id,
                func.max(PackageVersion.id).label(
                    "latest_version_id")  # Get the latest version_id
            )
            # Group by original_package_id
            .group_by(PackageVersion.original_package_id)
            .subquery()
        )

        query = (
            db.session.query(
                AccountProject.project_id,
                func.array_agg(
                    func.json_build_object(
                        "id", PackageModel.id,
                        "name", PackageModel.name,
                        "original_package_id", PackageVersion.original_package_id,
                    )
                ).label("packages")  # Aggregate packages as a JSON array
            )
            .join(PackageModel, PackageModel.account_project_id == AccountProject.id)
            .join(PackageVersion,
                  PackageModel.version_id == PackageVersion.id)  # Join with PackageVersion to filter by version_id
            .join(latest_versions_subquery,
                  # Only fetch packages with the latest version_id
                  PackageModel.version_id == latest_versions_subquery.c.latest_version_id)
            .filter(AccountProject.account_id == account_id)
        )

        if account_project_ids:
            query = query.filter(AccountProject.id.in_(account_project_ids))

        query = query.group_by(AccountProject.project_id)  # Group by project_id

        account_projects = query.all()

        return [
            {"project_id": project_id, "account_packages": packages}
            for project_id, packages in account_projects
        ]


class PackageItemQueries:
    """Query module for complex item status driven aggregation."""

    @classmethod
    def _get_required_item_statuses(cls, items: list) -> list[str]:
        """Get statuses of only required items based on package_item_types configuration."""
        if not items:
            return []

        # Get the package from the first item to determine package_type_id
        package = PackageModel.find_by_id(items[0].package_id)
        if not package:
            # If package not found, treat all items as required (backward compatible)
            return [item.status.value if isinstance(item.status, ItemStatus) else item.status for item in items]

        # Get required item type IDs from package_item_types
        package_item_types = PackageItemType.get_by_package_type_id(package.type_id)
        required_item_type_ids = {pit.item_type_id for pit in package_item_types if pit.is_required}

        # Filter for required items only
        required_items = [item for item in items if item.type_id in required_item_type_ids]

        return [item.status.value if isinstance(item.status, ItemStatus) else item.status for item in required_items]

    @classmethod
    def _add_partially_completed_status(cls, aggregated_statuses: set, statuses: list[str]):
        """Find partially completed packages (based on required items only)"""
        if (ItemStatus.PARTIALLY_COMPLETED.value
                in statuses or len(statuses) > statuses.count(ItemStatus.COMPLETED.value) > 0):
            aggregated_statuses.add(PackageStatus.PARTIALLY_COMPLETED.value)

    @classmethod
    def _add_completed_status(cls, aggregated_statuses: set, statuses: list[str]):
        """Find completed packages (based on required items only)"""
        # Only add COMPLETED if nothing is already SUBMITTED
        if PackageStatus.SUBMITTED.value in aggregated_statuses:
            return
        if statuses and all(status == ItemStatus.COMPLETED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.COMPLETED.value)

    @classmethod
    def _add_submitted_status(cls, aggregated_statuses: set, required_statuses: list[str], all_statuses: list[str]):
        """Find submitted packages"""
        # Add SUBMITTED if all required items are submitted
        if required_statuses:
            if all(status == ItemStatus.SUBMITTED.value for status in required_statuses):
                aggregated_statuses.add(PackageStatus.SUBMITTED.value)
        # If no items are required, add SUBMITTED if any item is submitted
        elif all_statuses:
            if any(status == ItemStatus.SUBMITTED.value for status in all_statuses):
                aggregated_statuses.add(PackageStatus.SUBMITTED.value)

    @classmethod
    def _add_passed_consultation_check(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that passed consultation check"""
        if any(status in [ItemStatus.ACCEPTED.value, ItemStatus.APPROVED.value,
                          ItemStatus.SATISFIED.value] for status in statuses):
            return
        if any(status == ItemStatus.PASSED_CONSULTATION_CHECK.value for status in statuses):
            aggregated_statuses.add(
                PackageStatus.PASSED_CONSULTATION_CHECK.value)

    @classmethod
    def _add_review_rejected(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.REVIEW_REJECTED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.REVIEW_REJECTED.value)

    @classmethod
    def _add_review_not_completed(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have not been completed during review"""
        if any(status == ItemStatus.REVIEW_NOT_COMPLETED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.REVIEW_NOT_COMPLETED.value)

    @classmethod
    def _add_under_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.UNDER_REVIEW.value for status in statuses):
            aggregated_statuses.add(PackageStatus.UNDER_REVIEW.value)

    @classmethod
    def _add_under_cc_check(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.UNDER_CONSULTATION_CHECK.value for status in statuses):
            aggregated_statuses.add(
                PackageStatus.UNDER_CONSULTATION_CHECK.value)

    @classmethod
    def _add_mp_approved(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.APPROVED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.APPROVED.value)
        elif any(status == ItemStatus.ACCEPTED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.ACCEPTED.value)
        elif any(status == ItemStatus.SATISFIED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.SATISFIED.value)
        elif any(status == ItemStatus.REVIEWED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.REVIEWED.value)

    @classmethod
    def add_awaiting_manager_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        cls._add_awaiting_cc_manager_review(aggregated_statuses, statuses)
        cls._add_awaiting_mp_manager_review(aggregated_statuses, statuses)

    @classmethod
    def _add_awaiting_cc_manager_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.CC_AWAITING_MANAGER_APPROVAL.value for status in statuses):
            aggregated_statuses.add(
                PackageStatus.CC_AWAITING_MANAGER_APPROVAL.value)

    @classmethod
    def _add_awaiting_mp_manager_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.MP_AWAITING_MANAGER_APPROVAL.value for status in statuses):
            aggregated_statuses.add(
                PackageStatus.MP_AWAITING_MANAGER_APPROVAL.value)

    @classmethod
    def _add_awaiting_iem_manager_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.IEM_AWAITING_MANAGER_APPROVAL.value for status in statuses):
            aggregated_statuses.add(
                PackageStatus.IEM_AWAITING_MANAGER_APPROVAL.value)

    @classmethod
    def aggregate_item_statuses(cls, items: list):
        """Aggregate item statuses (considers only required items for completion/submission status)"""
        # Get all item statuses for review-related statuses (these apply to all items)
        all_statuses = [item.status.value if isinstance(item.status, ItemStatus)
                        else item.status
                        for item in items]

        # Get required item statuses for completion/submission checks
        required_statuses = cls._get_required_item_statuses(items)

        aggregated_statuses = set()

        # Review-related statuses check all items
        cls._add_mp_approved(aggregated_statuses, all_statuses)
        cls._add_review_rejected(aggregated_statuses, all_statuses)
        if aggregated_statuses:
            return list(aggregated_statuses)

        # Completion/submission statuses check only required items
        cls._add_submitted_status(aggregated_statuses, required_statuses, all_statuses)
        cls._add_partially_completed_status(aggregated_statuses, required_statuses)
        cls._add_completed_status(aggregated_statuses, required_statuses)

        # Other statuses check all items
        cls._add_passed_consultation_check(aggregated_statuses, all_statuses)
        cls._add_review_not_completed(aggregated_statuses, all_statuses)
        cls._add_under_review(aggregated_statuses, all_statuses)
        cls._add_under_cc_check(aggregated_statuses, all_statuses)
        cls.add_awaiting_manager_review(aggregated_statuses, all_statuses)

        aggregated_statuses_list = list(aggregated_statuses)
        return aggregated_statuses_list

    @staticmethod
    def update_package_status(package_id, session, package=None):
        """Update the status of the package based on the statuses of its items."""
        if not package:
            package = session.query(
                PackageModel).filter_by(id=package_id).one()
        # Determine new package statuses based on item statuses
        new_statuses = PackageItemQueries.aggregate_item_statuses(package.items)
        if set(package.status) != set(new_statuses):
            package.status = list(new_statuses)
            session.add(package)


class PackageSubmissionQueries:
    """Query module for complex submission status driven aggregation."""

    @classmethod
    def _add_new_submission_status(cls, aggregated_statuses, statuses: set[SubmissionStatus]):
        """Add NEW_SUBMISSION status when no review actions have been taken yet."""
        if not statuses or statuses == {SubmissionStatus.SUBMITTED.value}:
            aggregated_statuses.append(PackageStatus.NEW_SUBMISSION.value)

    @classmethod
    def _add_internal_verification_status(
        cls, aggregated_statuses, statuses: set[SubmissionStatus]
    ):
        """Add INTERNAL_VERIFICATION status when at least one doc is past the VERIFIED stage."""
        if (
            statuses == {SubmissionStatus.SUBMITTED.value, SubmissionStatus.VERIFIED.value} or
            statuses == {SubmissionStatus.SUBMITTED.value, SubmissionStatus.ACKNOWLEDGED.value} or
            statuses == {SubmissionStatus.SUBMITTED.value, SubmissionStatus.ACKNOWLEDGED.value, SubmissionStatus.VERIFIED.value}
        ):
            aggregated_statuses.append(PackageStatus.INTERNAL_VERIFICATION.value)

    @classmethod
    def _add_verified_status(
        cls,
        aggregated_statuses,
        statuses: set[SubmissionStatus]
    ):
        """Add VERIFIED when all docs are VERIFIED, or are some combination of VERIFIED and ACKNOWLEDGED."""
        if (
            statuses == {SubmissionStatus.VERIFIED.value} or
            statuses == {SubmissionStatus.VERIFIED.value, SubmissionStatus.ACKNOWLEDGED.value}
        ):
            aggregated_statuses.append(PackageStatus.VERIFIED.value)

    @classmethod
    def _add_pending_acknowledgement_status(
        cls,
        aggregated_statuses,
        statuses: set[SubmissionStatus]
    ):
        """Add PENDING_ACKNOWLEDGEMENT when all docs are VERIFIED, or are some combination of VERIFIED/ACKNOWLEDGED."""
        if statuses == {SubmissionStatus.VERIFIED.value, SubmissionStatus.ACKNOWLEDGED.value}:
            aggregated_statuses.append(PackageStatus.PENDING_ACKNOWLEDGEMENT.value)

    @classmethod
    def _add_ready_for_acknowledgement_status(
        cls, aggregated_statuses, statuses: set[SubmissionStatus]
    ):
        """Add READY_FOR_ACKNOWLEDGEMENT when all docs are acknowledged."""
        if statuses == {SubmissionStatus.ACKNOWLEDGED.value}:
            aggregated_statuses.append(PackageStatus.READY_FOR_ACKNOWLEDGEMENT.value)

    @classmethod
    def _add_update_request_overlay(cls, aggregated_statuses, package):
        """Overlay UPDATE_REQUESTED or UPDATED on top of intermediate statuses.

        Only applies when the package is still in an actionable review state —
        not once it's been approved/not approved.
        """
        terminal = {PackageStatus.APPROVED.value, PackageStatus.NOT_APPROVED.value}
        if any(s in terminal for s in aggregated_statuses):
            return

        active_requests = [ur for ur in package.update_requests if ur.active]
        if not active_requests:
            return

        all_pending_review = all(
            ur.status == UpdateRequestStatus.PENDING_REVIEW.value
            for ur in active_requests
        )
        overlay = PackageStatus.UPDATED.value if all_pending_review else PackageStatus.UPDATE_REQUESTED.value
        aggregated_statuses.append(overlay)

    @classmethod
    def aggregate_submission_statuses(cls, package) -> list[str]:
        """Derive package display status(es) from the aggregate state of its submissions and update requests.

        This handles the logic for Type A/B/C staged workflows up to
        READY_FOR_ACKNOWLEDGEMENT status, as further package status changes are done at
        the package level and do not require aggregated submission statuses.
        """
        approval_type = package.type.approval_type
        submissions = [
            s for item in package.items
            for s in item.submissions
            if s.active and not s.deleted and s.type == SubmissionType.DOCUMENT
        ]

        if not submissions:
            return [PackageStatus.NEW_SUBMISSION.value]

        statuses = {s.status.value if isinstance(s.status, SubmissionStatus)
                    else s.status
                    for s in submissions}

        aggregated_statuses = []

        # Ensure NEW_SUBMISSION status when no review actions taken
        cls._add_new_submission_status(aggregated_statuses, statuses)

        # Type A staged workflow
        if (approval_type == PackageApprovalType.A):
            cls._add_internal_verification_status(aggregated_statuses, statuses)
            cls._add_verified_status(aggregated_statuses, statuses)

        # Type B/C staged workflow
        if (approval_type in [PackageApprovalType.B, PackageApprovalType.C]):
            cls._add_internal_verification_status(aggregated_statuses, statuses)
            cls._add_verified_status(aggregated_statuses, statuses)
            cls._add_pending_acknowledgement_status(aggregated_statuses, statuses)
            cls._add_ready_for_acknowledgement_status(aggregated_statuses, statuses)

        # Overlay update request state last — it sits on top of whatever base state we have
        cls._add_update_request_overlay(aggregated_statuses, package)

        return aggregated_statuses

    @staticmethod
    def update_package_status_from_submissions(package_id, session, package=None):
        """Update package status based on submission states."""
        if not package:
            package = session.query(PackageModel).filter_by(id=package_id).one()

        new_statuses = PackageSubmissionQueries.aggregate_submission_statuses(package)
        if package.status != new_statuses:
            package.status = new_statuses
            session.add(package)
