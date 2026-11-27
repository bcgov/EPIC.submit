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
"""Service for database-driven non-work package maps (Management Plan, Report)."""
from submit_api.enums.non_work_item import NonWorkItemEligibility, NonWorkItemType
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models.non_work_package_map import NonWorkPackageMap
from submit_api.models.project import Project


class NonWorkPackageMapService:
    """Resolve which non-work package maps apply to a project."""

    @classmethod
    def get_eligible_for_project(cls, project: Project, onboarding_only: bool = False) -> list:
        """Return the active package maps the project is eligible for, in display order.

        When onboarding_only is True, only package maps offered as onboarding selections are returned.
        """
        if not project:
            return []
        package_maps = NonWorkPackageMap.get_all_active()
        if onboarding_only:
            package_maps = [package_map for package_map in package_maps if package_map.is_onboarding_option]
        return [package_map for package_map in package_maps if cls._is_eligible(project, package_map)]

    @classmethod
    def get_eligible_for_project_id(cls, project_id: int) -> list:
        """Return the eligible package maps for a project id."""
        project = Project.find_by_id(project_id)
        if not project:
            raise ResourceNotFoundError(f"Project {project_id} not found.")
        return cls.get_eligible_for_project(project)

    @classmethod
    def is_eligible(cls, project: Project, item_type: NonWorkItemType, onboarding_only: bool = False) -> bool:
        """Return True if the project is eligible for the package map of the given non-work item type.

        When onboarding_only is True, package maps that are not onboarding options are never eligible.
        """
        package_map = NonWorkPackageMap.find_by_code(item_type.value)
        if not package_map or not project:
            return False
        if onboarding_only and not package_map.is_onboarding_option:
            return False
        return cls._is_eligible(project, package_map)

    @staticmethod
    def _is_eligible(project: Project, package_map: NonWorkPackageMap) -> bool:
        """Apply the package map's eligibility rule to the project."""
        rule = package_map.eligibility_rule
        if rule == NonWorkItemEligibility.ALWAYS:
            return True
        if rule == NonWorkItemEligibility.APPROVED_CONDITION:
            return bool(project.has_approved_condition)
        return False
