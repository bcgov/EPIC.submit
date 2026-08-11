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
Error types: missing_column | missing_value | invalid_code | no_shapefile |
             null_geometry | self_intersection | invalid_geometry.

Fiona is used for streaming so the entire feature set is never held in memory.
"""
from __future__ import annotations

import logging
import os
import tempfile

try:
    import fiona
except ImportError:
    from unittest.mock import MagicMock
    fiona = MagicMock()  # Stub so tests can patch validator.fiona.open

try:
    from shapely.geometry import shape as _shapely_shape
    from shapely.validation import explain_validity as _shapely_explain_validity
except ImportError:
    _shapely_shape = None
    _shapely_explain_validity = None

from submit_api.services.geo.archive import find_shapefiles, safe_extract_zip
from submit_api.services.geo.validation_rules import (
    ALLOWED_VALUES,
    CASE_INSENSITIVE,
    FIELD_MAP,
    MAX_ERRORS,
    NULLABLE_FIELDS,
    OPTIONAL_FIELDS,
    VALIDATE_GEOMETRY,
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


def _validate_geometry(idx: int, geom: dict | None) -> _ErrorList:
    """Validate a single feature's geometry.

    Detects three distinct failures and tags each with its own ``error_type``:
    - ``null_geometry``     — geometry is absent or empty.
    - ``self_intersection`` — invalid topology caused by a self-intersection.
    - ``invalid_geometry``  — any other invalid topology (ring order, etc.).

    Returns a list of error dicts (empty if the geometry is valid).
    """
    shape = _shapely_shape
    explain_validity = _shapely_explain_validity

    if geom is None:
        return [{
            "feature_index": idx,
            "field": "geometry",
            "dbf_column": None,
            "error_type": "null_geometry",
            "value": None,
            "message": f"Feature {idx}: geometry is missing (null).",
        }]

    try:
        shp = shape(geom)
    except (TypeError, ValueError, AttributeError) as exc:
        return [{
            "feature_index": idx,
            "field": "geometry",
            "dbf_column": None,
            "error_type": "invalid_geometry",
            "value": None,
            "message": f"Feature {idx}: geometry could not be parsed ({exc}).",
        }]

    if shp.is_empty:
        return [{
            "feature_index": idx,
            "field": "geometry",
            "dbf_column": None,
            "error_type": "null_geometry",
            "value": None,
            "message": f"Feature {idx}: geometry is empty.",
        }]

    if not shp.is_valid:
        reason = explain_validity(shp)
        is_self_intersection = "self-intersection" in reason.lower()
        return [{
            "feature_index": idx,
            "field": "geometry",
            "dbf_column": None,
            "error_type": "self_intersection" if is_self_intersection else "invalid_geometry",
            "value": None,
            "message": (
                f"Feature {idx}: polygon is self-intersecting ({reason})."
                if is_self_intersection
                else f"Feature {idx}: geometry is invalid ({reason})."
            ),
        }]

    return []


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

        # Row-level checks are split in two: attribute value/nullability checks
        # are gated behind VALIDATE_VALUES (spec not yet confirmed), while
        # geometry checks are gated behind VALIDATE_GEOMETRY. When neither is on,
        # a file with all required columns passes without scanning any rows.
        if not VALIDATE_VALUES and not VALIDATE_GEOMETRY:
            return True, [], {"total_errors": 0, "capped": False, "fields_with_errors": []}

        # --- Row-level validation (streaming) --------------------------------
        fields_with_errors: set[str] = set()

        for idx, feature in enumerate(src):
            if len(errors) >= MAX_ERRORS:
                capped = True
                break

            feature_errors: _ErrorList = []
            if VALIDATE_GEOMETRY:
                feature_errors.extend(_validate_geometry(idx, feature.get("geometry")))
            if VALIDATE_VALUES:
                feature_errors.extend(
                    _validate_feature(idx, feature.get("properties", {}) or {})
                )

            errors.extend(feature_errors)
            fields_with_errors.update(e["field"] for e in feature_errors if e["field"])

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
            safe_extract_zip(local_path, tmpdir)
            shp_files = find_shapefiles(tmpdir)

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
