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
from submit_api.models import db
from submit_api.models.package_type import PackageType
from submit_api.models.track_phase import TrackPhase
from submit_api.models.track_work import TrackWork


# pylint: disable=too-few-public-methods
class PackageTypeQueries:
    """Query module for complex package_type queries"""

    @classmethod
    def find_by_project_id(cls, project_id: int, eligible_non_work_package_map_ids: list[int] = None):
        """Return package types for a project's current work phases and its eligible non-work package maps."""
        # Get phase IDs from active works on this project
        phase_ids = (
            db.session.query(TrackWork.current_phase_id)
            .join(TrackPhase, TrackPhase.id == TrackWork.current_phase_id)
            .filter(
                TrackWork.project_id == project_id,
                TrackWork.current_phase_id.isnot(None),
                TrackPhase.enable_submit.is_(True)
            )
            .distinct()
            .subquery()
        )

        conditions = [
            or_(PackageType.start_phase_id.in_(phase_ids), PackageType.end_phase_id.in_(phase_ids))
        ]

        # Include phase-less package types linked to a non-work package map the project is eligible for
        # (e.g. Management Plan and IEM -> Management Plan, Report -> Report, for approved-condition projects).
        if eligible_non_work_package_map_ids:
            conditions.append(
                and_(
                    PackageType.start_phase_id.is_(None),
                    PackageType.end_phase_id.is_(None),
                    PackageType.non_work_package_map_id.in_(eligible_non_work_package_map_ids),
                )
            )

        return db.session.query(PackageType).filter(or_(*conditions)).all()
