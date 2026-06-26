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
"""Attribute validation rules for the EAO SpatialDataTemplate.

FIELD_MAP maps a logical field key to the real DBF column name.
DBF names are capped at 10 characters and cannot contain spaces, so they
differ from the friendly names shown in the template.

TODO: Once a filled SpatialDataTemplate shapefile is available, open it with
      `fiona.open(path).schema['properties']` and update the DBF column names
      on the right-hand side of FIELD_MAP to match exactly.
"""

# Maps logical field key → actual DBF column name in the shapefile.
# Verified against a real EAO SpatialDataTemplate export (BaptisteNickel.dbf).
FIELD_MAP: dict[str, str] = {
    "category":               "Category",
    "sub_category":           "Subcategor",
    "component":              "Component",
    "sensitive_data":         "Sensitived",
    "source_of_spatial_data": "SourceofSp",
    "footprint":              "Footprint",
}

# Master switch for row-level value/nullability validation.
# Disabled until EAO confirms the authoritative allowed-value list for the
# SpatialDataTemplate — real exports use full labels ("Project Notification")
# and leave fields empty, which the sets below do not yet reflect. While False,
# validate_shapefile only checks that the required columns (FIELD_MAP) exist.
# ALLOWED_VALUES / NULLABLE_FIELDS are retained so value checks can be switched
# back on without rework once the spec is confirmed.
VALIDATE_VALUES: bool = False

ALLOWED_VALUES: dict[str, set[str]] = {
    "category":               {"PN", "EAC", "PD"},
    "sub_category":           {"Pre EA", "EE", "RD", "PP", "ADR", "EAR", "P", "C", "O", "CM", "D", "A", "N"},
    "component":              {"Value component", "Subcomponent", "Major"},
    "sensitive_data":         {"Yes", "No"},
    "source_of_spatial_data": {"Proponent", "Catalogue", "Other"},
    "footprint":              {"Yes", "No"},
}

# Fields whose value may be null/empty — all others are required.
NULLABLE_FIELDS: set[str] = {"sensitive_data"}

# Set to True to fold both the feature value and the allowed set to uppercase
# before comparing. False = exact case match.
CASE_INSENSITIVE: bool = False

# Maximum number of row-level errors to collect before stopping.
MAX_ERRORS: int = 200
