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
"""Non-work package map schema class."""
from marshmallow import EXCLUDE, Schema, fields


class NonWorkPackageMapSchema(Schema):
    """Schema for a non-work package map (e.g. Management Plan, Report) and its display labels."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    code = fields.Str(data_key="code")
    work_label = fields.Str(data_key="work_label")
    phase_label = fields.Str(data_key="phase_label")
    sort_order = fields.Int(data_key="sort_order")
