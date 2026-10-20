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
"""ProjectReport model class.

Stores approved report obligations synced from the condition repository.
Each row represents a single report phase (submission) for a project.
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String, Text, UniqueConstraint

from .base_model import BaseModel
from .db import db


class ProjectReport(BaseModel):  # pylint: disable=too-many-instance-attributes
    """Definition of the ProjectReport entity.

    A flat table holding one row per approved report phase for a project. Rows
    are synced from the condition repository: new rows are inserted and existing
    rows are updated in place, but rows removed from the source are never
    removed here (removals are handled manually).
    """

    __tablename__ = 'project_reports'
    __table_args__ = (
        UniqueConstraint(
            'project_id', 'report_id', 'phase', 'timing', 'frequency',
            name='uq_project_report_phase',
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    report_id = Column(Integer, nullable=False)
    condition_number = Column(Integer, nullable=True)
    condition_subsection = Column(String(255), nullable=True)
    report_type = Column(String(255), nullable=True)
    report_sub_type = Column(String(255), nullable=True)
    report_name = Column(Text, nullable=True)
    phase = Column(String(255), nullable=True)
    frequency = Column(String(255), nullable=True)
    timing = Column(Text, nullable=True)
    management_plan = Column(String(255), nullable=True)
    display_name = Column(Text, nullable=True)

    project = db.relationship('Project', foreign_keys=[project_id], lazy='joined')

    def to_dict(self):
        """Return a dictionary representation of the model."""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'report_id': self.report_id,
            'condition_number': self.condition_number,
            'condition_subsection': self.condition_subsection,
            'report_type': self.report_type,
            'report_sub_type': self.report_sub_type,
            'report_name': self.report_name,
            'phase': self.phase,
            'frequency': self.frequency,
            'timing': self.timing,
            'management_plan': self.management_plan,
            'display_name': self.display_name,
        }

    @classmethod
    def get_by_project_id(cls, project_id: int):
        """Return all report rows for a given project id."""
        return cls.query.filter_by(project_id=project_id).all()
