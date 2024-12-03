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
from submit_api.enums.item_status import ItemStatus
from submit_api.models.package import Package as PackageModel
from submit_api.models.package import PackageStatus


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
        if any(status == ItemStatus.PASSED_CONSULTATION_CHECK.value for status in statuses):
            aggregated_statuses.add(PackageStatus.PASSED_CONSULTATION_CHECK.value)

    @classmethod
    def aggregate_item_statuses(cls, items: list):
        """Aggregate item statuses"""
        statuses = [item.status.value if isinstance(item.status, ItemStatus)
                    else item.status
                    for item in items]
        aggregated_statuses = set()
        cls._add_partially_completed_status(aggregated_statuses, statuses)
        cls._add_completed_status(aggregated_statuses, statuses)
        cls._add_submitted_status(aggregated_statuses, statuses)
        cls._add_passed_consultation_check(aggregated_statuses, statuses)
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
