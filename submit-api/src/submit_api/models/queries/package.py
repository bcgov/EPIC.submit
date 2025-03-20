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


# pylint: disable=too-few-public-methods
class PackageQueries:
    """Query module for complex package queries"""

    @classmethod
    def _add_partially_completed_status(cls, aggregated_statuses: set, statuses: list[str]):
        """Find partially completed packages"""
        if (ItemStatus.PARTIALLY_COMPLETED.value
                in statuses or len(statuses) > statuses.count(ItemStatus.COMPLETED.value) > 0):
            aggregated_statuses.add(PackageStatus.PARTIALLY_COMPLETED.value)

    @classmethod
    def _add_completed_status(cls, aggregated_statuses: set, statuses: list[str]):
        """Find completed packages"""
        if all(status == ItemStatus.COMPLETED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.COMPLETED.value)

    @classmethod
    def _add_submitted_status(cls, aggregated_statuses: set, statuses: list[str]):
        """Find submitted packages"""
        if all(status == ItemStatus.SUBMITTED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.SUBMITTED.value)

    @classmethod
    def _add_passed_consultation_check(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that passed consultation check"""
        if any(status in [ItemStatus.ACCEPTED.value, ItemStatus.APPROVED.value,
                          ItemStatus.SATISFIED.value] for status in statuses):
            return
        if any(status == ItemStatus.PASSED_CONSULTATION_CHECK.value for status in statuses):
            aggregated_statuses.add(PackageStatus.PASSED_CONSULTATION_CHECK.value)

    @classmethod
    def _add_review_rejected(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.REVIEW_REJECTED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.REVIEW_REJECTED.value)

    @classmethod
    def _add_under_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.UNDER_REVIEW.value for status in statuses):
            aggregated_statuses.add(PackageStatus.UNDER_REVIEW.value)

    @classmethod
    def _add_under_cc_check(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.UNDER_CONSULTATION_CHECK.value for status in statuses):
            aggregated_statuses.add(PackageStatus.UNDER_CONSULTATION_CHECK.value)

    @classmethod
    def _add_mp_approved(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.APPROVED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.APPROVED.value)
        elif any(status == ItemStatus.ACCEPTED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.ACCEPTED.value)
        elif any(status == ItemStatus.SATISFIED.value for status in statuses):
            aggregated_statuses.add(PackageStatus.SATISFIED.value)

    @classmethod
    def add_awaiting_manager_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        cls._add_awaiting_cc_manager_review(aggregated_statuses, statuses)
        cls._add_awaiting_mp_manager_review(aggregated_statuses, statuses)

    @classmethod
    def _add_awaiting_cc_manager_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.CC_AWAITING_MANAGER_APPROVAL.value for status in statuses):
            aggregated_statuses.add(PackageStatus.CC_AWAITING_MANAGER_APPROVAL.value)

    @classmethod
    def _add_awaiting_mp_manager_review(cls, aggregated_statuses: set, statuses: list[str]):
        """Find packages that have been rejected during review"""
        if any(status == ItemStatus.MP_AWAITING_MANAGER_APPROVAL.value for status in statuses):
            aggregated_statuses.add(PackageStatus.MP_AWAITING_MANAGER_APPROVAL.value)

    @classmethod
    def aggregate_item_statuses(cls, items: list):
        """Aggregate item statuses"""
        statuses = [item.status.value if isinstance(item.status, ItemStatus)
                    else item.status
                    for item in items]
        aggregated_statuses = set()
        cls._add_mp_approved(aggregated_statuses, statuses)
        cls._add_review_rejected(aggregated_statuses, statuses)
        if aggregated_statuses:
            return list(aggregated_statuses)
        cls._add_partially_completed_status(aggregated_statuses, statuses)
        cls._add_completed_status(aggregated_statuses, statuses)
        cls._add_submitted_status(aggregated_statuses, statuses)
        cls._add_passed_consultation_check(aggregated_statuses, statuses)
        cls._add_review_rejected(aggregated_statuses, statuses)
        cls._add_under_review(aggregated_statuses, statuses)
        cls._add_under_cc_check(aggregated_statuses, statuses)
        cls.add_awaiting_manager_review(aggregated_statuses, statuses)
        aggregated_statuses_list = list(aggregated_statuses)
        return aggregated_statuses_list

    @staticmethod
    def update_package_status(package_id, session, package=None):
        """Update the status of the package based on the statuses of its items."""
        if not package:
            package = session.query(PackageModel).filter_by(id=package_id).one()
        # Determine new package statuses based on item statuses
        new_statuses = PackageQueries.aggregate_item_statuses(package.items)
        if set(package.status) != set(new_statuses):
            package.status = list(new_statuses)
            session.add(package)

    @classmethod
    def get_account_project_packages(cls, account_id: int):
        """Fetch project_id and related packages (id, name) for a given account_id.

        Only includes packages with the latest version_id matching the highest version
        of the original_package_id from package_versions.
        """
        # Subquery to get the latest version_id for each original_package_id
        latest_versions_subquery = (
            db.session.query(
                PackageVersion.original_package_id,
                func.max(PackageVersion.id).label("latest_version_id")  # Get the latest version_id
            )
            .group_by(PackageVersion.original_package_id)  # Group by original_package_id
            .subquery()
        )

        query = (
            db.session.query(
                AccountProject.project_id,
                func.array_agg(
                    func.json_build_object(
                        "id", PackageModel.id,
                        "name", PackageModel.name
                    )
                ).label('packages')  # Aggregate packages as a JSON array
            )
            .join(PackageModel, PackageModel.account_project_id == AccountProject.id)
            .join(
                latest_versions_subquery,
                PackageModel.version_id == latest_versions_subquery.c.latest_version_id
            )  # Only fetch packages with the latest version_id
            .filter(AccountProject.account_id == account_id)
            .group_by(AccountProject.project_id)  # Group by project_id
            .all()
        )

        return [
            {"project_id": project_id, "account_packages": packages}
            for project_id, packages in query
        ]
