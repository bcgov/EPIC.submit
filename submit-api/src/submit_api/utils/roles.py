# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Role definitions."""
from enum import Enum


class EpicSubmitRole(Enum):
    """User Role."""

    EAO_EDIT = "eao_edit"
    EAO_VIEW = "eao_view"
    EAO_CREATE = "eao_create"
    EXTENDED_EAO_EDIT = "extended_eao_edit"
    PROPONENT_CREATE = "proponent_create"
    MANAGE_USERS = "manage-users"
