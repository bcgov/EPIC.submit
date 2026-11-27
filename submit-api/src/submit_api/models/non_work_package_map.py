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
"""Non-work package map model.

Database-driven definition of the non-work groupings (Management Plan, Report) that
packages belong to when they are not tied to an EPIC.track work. Package types point
here through package_types.non_work_package_map_id. There is one row per
NonWorkItemType enum value, holding the work/phase labels shown in the UI and the
project eligibility rule.
"""
from __future__ import annotations

from sqlalchemy import Column

from .base_model import BaseModel
from .db import db
from ..enums.non_work_item import NonWorkItemEligibility, NonWorkItemType


class NonWorkPackageMap(BaseModel):
    """Definition of a non-work package map and how it is displayed."""

    __tablename__ = 'non_work_package_map'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    code = Column(
        db.String(50), nullable=False, unique=True,
        comment="Matches the NonWorkItemType enum value, e.g. MANAGEMENT_PLAN"
    )
    work_label = Column(
        db.String(255), nullable=False,
        comment="Text shown in the Work column/filter, e.g. Management Plan & Related Documents"
    )
    phase_label = Column(
        db.String(255), nullable=False,
        comment="Text shown in the Phase column/filter, e.g. Post Decision"
    )
    eligibility = Column(
        db.String(50), nullable=False,
        comment="NonWorkItemEligibility value deciding which projects this package map applies to"
    )
    is_onboarding_option = Column(
        db.Boolean, nullable=False, default=False,
        comment="Whether this package map is offered as a selectable entry when onboarding a proponent"
    )
    sort_order = Column(db.Integer, nullable=False, default=0)
    is_active = Column(db.Boolean, nullable=False, default=True)

    @property
    def item_type(self) -> NonWorkItemType:
        """Return the NonWorkItemType enum member for this row."""
        return NonWorkItemType(self.code)

    @property
    def eligibility_rule(self) -> NonWorkItemEligibility:
        """Return the NonWorkItemEligibility enum member for this row."""
        return NonWorkItemEligibility(self.eligibility)

    @classmethod
    def get_all_active(cls):
        """Return all active package maps in display order."""
        return cls.query.filter_by(is_active=True).order_by(cls.sort_order, cls.id).all()

    @classmethod
    def find_by_code(cls, code: str):
        """Return the active package map with the given code (a NonWorkItemType value), if any."""
        return cls.query.filter_by(code=code, is_active=True).first()
