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
"""Model to handle all complex operations related to User."""
from sqlalchemy import func
from submit_api.enums.item_status import ItemStatus
from submit_api.models import AccountProject, db
from submit_api.models.package import Package as PackageModel
from submit_api.models.package import PackageStatus
from submit_api.models.package_version import PackageVersion
from submit_api.models.package_item_type import PackageItemType


# pylint: disable=too-few-public-methods
class PackageQueries:
    """Query module for complex package queries"""

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
        cls._add_additional_info_status(aggregated_statuses, items)

        aggregated_statuses_list = list(aggregated_statuses)
        return aggregated_statuses_list

    @classmethod
    def _add_additional_info_status(cls, aggregated_statuses: set, items: list):
        """Find Additional Information package status based on document verification."""
        if not items:
            return

        from submit_api.enums.package_type import PackageTypeEnum
        from submit_api.models import Package as PackageModel
        from submit_api.models.submission import SubmissionStatus, SubmissionType

        package = PackageModel.find_by_id(items[0].package_id)
        if not package or package.type.versioning_enabled:
            return

        # If it's Additional Information, we override the normal status logic for verified/internal verification
        # but keep SUBMITTED if nothing is verified yet.
        
        all_submissions = [s for item in items for s in item.submissions if s.type == SubmissionType.DOCUMENT]
        if not all_submissions:
            return

        verified_count = sum(1 for s in all_submissions if s.status == SubmissionStatus.VERIFIED)
        acknowledged_count = sum(1 for s in all_submissions if s.status == SubmissionStatus.ACKNOWLEDGED)
        
        total_reviewable = verified_count + acknowledged_count
        
        if acknowledged_count == len(all_submissions):
            aggregated_statuses.clear() # Clear other statuses like SUBMITTED
            aggregated_statuses.add(PackageStatus.ACKNOWLEDGED.value)
        elif total_reviewable == len(all_submissions):
            aggregated_statuses.clear() # Clear other statuses like SUBMITTED
            aggregated_statuses.add(PackageStatus.VERIFIED.value)
        elif total_reviewable > 0:
            aggregated_statuses.clear() # Clear other statuses like SUBMITTED
            aggregated_statuses.add(PackageStatus.INTERNAL_VERIFICATION.value)
        # If none verified/acknowledged, it will stay as SUBMITTED (from _add_submitted_status)

    @staticmethod
    def update_package_status(package_id, session, package=None):
        """Update the status of the package based on the statuses of its items."""
        if not package:
            package = session.query(
                PackageModel).filter_by(id=package_id).one()
        # Determine new package statuses based on item statuses
        new_statuses = PackageQueries.aggregate_item_statuses(package.items)
        if set(package.status) != set(new_statuses):
            package.status = list(new_statuses)
            session.add(package)

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
