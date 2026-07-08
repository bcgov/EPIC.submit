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
"""Shapefile attribute validator for the EAO SpatialDataTemplate.

Entry points:
- validate_geo_file(local_path)  — handles .shp and .zip files
- validate_shapefile(shp_path)   — validates a single .shp using fiona (streaming)

Both return (is_valid: bool, errors: list[dict], summary: dict).

Error dict keys: feature_index, field, dbf_column, error_type, value, message.
Error types: missing_column | missing_value | invalid_code | no_shapefile.

Fiona is used for streaming so the entire feature set is never held in memory.
"""
from __future__ import annotations

import glob
import logging
import os
import tempfile
import zipfile

import fiona

from submit_api.services.geo.validation_rules import (
    ALLOWED_VALUES,
    CASE_INSENSITIVE,
    FIELD_MAP,
    MAX_ERRORS,
    NULLABLE_FIELDS,
    OPTIONAL_FIELDS,
    VALIDATE_VALUES,
)

logger = logging.getLogger(__name__)

_ErrorList = list[dict]
_Summary = dict
_Result = tuple[bool, _ErrorList, _Summary]


def _validate_feature(idx: int, props: dict) -> _ErrorList:
    """Validate a single feature's properties against FIELD_MAP rules.

    Returns a list of error dicts (empty if the feature is valid).
    """
    feature_errors: _ErrorList = []

    for logical, dbf_col in FIELD_MAP.items():
        raw_val = props.get(dbf_col)

        # Normalise: strip whitespace; treat empty string as absent.
        val = raw_val.strip() if isinstance(raw_val, str) else raw_val
        if val == "":
            val = None

        allowed: set[str] = ALLOWED_VALUES[logical]

        if val is None:
            if logical not in NULLABLE_FIELDS:
                feature_errors.append({
                    "feature_index": idx,
                    "field": logical,
                    "dbf_column": dbf_col,
                    "error_type": "missing_value",
                    "value": raw_val,
                    "message": f"Feature {idx}: '{dbf_col}' is required but has no value.",
                })
        else:
            compare_val = val.upper() if CASE_INSENSITIVE else val
            compare_set = {v.upper() for v in allowed} if CASE_INSENSITIVE else allowed

            if compare_val not in compare_set:
                feature_errors.append({
                    "feature_index": idx,
                    "field": logical,
                    "dbf_column": dbf_col,
                    "error_type": "invalid_code",
                    "value": val,
                    "message": (
                        f"Feature {idx}: '{dbf_col}' value {repr(val)} is not in "
                        f"the allowed set {sorted(allowed)}."
                    ),
                })

    return feature_errors


def validate_shapefile(shp_path: str) -> _Result:
    """Validate a single shapefile's attributes against FIELD_MAP rules.

    Streams features one at a time; never loads the full dataset into memory.
    Returns (is_valid, errors, summary).
    """
    errors: _ErrorList = []
    capped = False

    with fiona.open(shp_path) as src:
        schema_props: dict = src.schema.get("properties", {})

        # --- Column presence check (fail fast before scanning rows) ----------
        missing: _ErrorList = [
            {
                "feature_index": None,
                "field": logical,
                "dbf_column": dbf_col,
                "error_type": "missing_column",
                "value": None,
                "message": f"Required column '{dbf_col}' is absent from the shapefile schema.",
            }
            for logical, dbf_col in FIELD_MAP.items()
            if logical not in OPTIONAL_FIELDS and dbf_col not in schema_props
        ]
        if missing:
            return False, missing, {
                "total_errors": len(missing),
                "capped": False,
                "fields_with_errors": [e["field"] for e in missing],
            }

        # Value/nullability checks are gated until the official allowed-value
        # spec is confirmed; until then a file with all required columns passes.
        if not VALIDATE_VALUES:
            return True, [], {"total_errors": 0, "capped": False, "fields_with_errors": []}

        # --- Row-level validation (streaming) --------------------------------
        fields_with_errors: set[str] = set()

        for idx, feature in enumerate(src):
            if len(errors) >= MAX_ERRORS:
                capped = True
                break

            feature_errors = _validate_feature(idx, feature.get("properties", {}) or {})
            errors.extend(feature_errors)
            fields_with_errors.update(e["field"] for e in feature_errors)

    return (
        len(errors) == 0,
        errors,
        {
            "total_errors": len(errors),
            "capped": capped,
            "fields_with_errors": sorted(fields_with_errors),
        },
    )


def validate_geo_file(local_path: str) -> _Result:
    """Validate a .shp or .zip file against FIELD_MAP rules.

    For .zip files every contained .shp is validated; errors are merged.
    Returns (is_valid, errors, summary).
    """
    if local_path.lower().endswith(".shp"):
        return validate_shapefile(local_path)

    if local_path.lower().endswith(".zip"):
        with tempfile.TemporaryDirectory() as tmpdir:
            with zipfile.ZipFile(local_path, "r") as zf:
                zf.extractall(tmpdir)

            shp_files = sorted(
                glob.glob(os.path.join(tmpdir, "**", "*.shp"), recursive=True)
            )

            if not shp_files:
                err = {
                    "feature_index": None,
                    "field": None,
                    "dbf_column": None,
                    "error_type": "no_shapefile",
                    "value": None,
                    "message": "No .shp files found inside the zip archive.",
                }
                return False, [err], {"total_errors": 1, "capped": False, "fields_with_errors": []}

            all_errors: _ErrorList = []
            all_fields: set[str] = set()
            any_capped = False

            for shp in shp_files:
                _, errs, summary = validate_shapefile(shp)
                all_errors.extend(errs)
                all_fields.update(summary.get("fields_with_errors", []))
                if summary.get("capped"):
                    any_capped = True
                if len(all_errors) >= MAX_ERRORS:
                    any_capped = True
                    all_errors = all_errors[:MAX_ERRORS]
                    break

            return (
                len(all_errors) == 0,
                all_errors,
                {
                    "total_errors": len(all_errors),
                    "capped": any_capped,
                    "fields_with_errors": sorted(all_fields),
                },
            )

    raise ValueError(f"Unsupported file extension for validation: {os.path.basename(local_path)}")
