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
"""Model to handle all complex operations related to PackageType."""
from sqlalchemy import and_, or_
from submit_api.enums.package_type import PackageTypeEnum
from submit_api.models import db
from submit_api.models.package_type import PackageType
from submit_api.models.project import Project
from submit_api.models.track_work import TrackWork


# pylint: disable=too-few-public-methods
class PackageTypeQueries:
    """Query module for complex package_type queries"""

    @classmethod
    def find_by_project_id(cls, project_id: int):
        """Return package types associated with a project's current work phases."""
        # Get phase IDs from active works on this project
        phase_ids = (
            db.session.query(TrackWork.current_phase_id)
            .filter(
                TrackWork.project_id == project_id,
                TrackWork.current_phase_id.isnot(None)
            )
            .distinct()
            .subquery()
        )

        query = db.session.query(PackageType).filter(PackageType.phase_id.in_(phase_ids))

        # Include phase-less Management Plan types for approved condition projects
        project = Project.query.get(project_id)
        if project and project.has_approved_condition:
            query = db.session.query(PackageType).filter(
                or_(
                    PackageType.phase_id.in_(phase_ids),
                    and_(PackageType.phase_id.is_(None), PackageType.name == PackageTypeEnum.MANAGEMENT_PLAN.value)
                )
            )

        return query.all()
