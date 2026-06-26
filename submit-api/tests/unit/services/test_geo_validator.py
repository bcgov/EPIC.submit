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
"""Unit tests for geo.validator.validate_shapefile.

fiona.open is mocked so no real shapefiles are needed. Each test builds a
minimal fake fiona collection representing the schema and features that would
come from a real shapefile.

NOTE: The DBF column names in VALID_SCHEMA must match FIELD_MAP in
geo_validation_rules.py. Update them once the real SpatialDataTemplate
column names are confirmed.
"""
from unittest.mock import patch

import pytest

from submit_api.services.geo.validator import validate_shapefile
from submit_api.services.geo.validation_rules import FIELD_MAP


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Expected DBF column names (right-hand side of FIELD_MAP).
_DBF = {logical: dbf for logical, dbf in FIELD_MAP.items()}

VALID_SCHEMA = {
    _DBF["category"]:               "str:10",
    _DBF["sub_category"]:           "str:10",
    _DBF["component"]:              "str:50",
    _DBF["sensitive_data"]:         "str:3",
    _DBF["source_of_spatial_data"]: "str:20",
    _DBF["footprint"]:              "str:3",
}

VALID_PROPERTIES = {
    _DBF["category"]:               "PN",
    _DBF["sub_category"]:           "EE",
    _DBF["component"]:              "Subcomponent",
    _DBF["sensitive_data"]:         "No",
    _DBF["source_of_spatial_data"]: "Proponent",
    _DBF["footprint"]:              "Yes",
}


class _FakeCollection:
    """Minimal fiona-like context manager for testing."""

    def __init__(self, schema_props: dict, features: list[dict]):
        self.schema = {"properties": schema_props}
        self._features = features

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def __iter__(self):
        return iter(self._features)


def _feature(props: dict) -> dict:
    return {"type": "Feature", "geometry": None, "properties": props}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_valid_file_passes():
    """A fully compliant shapefile returns is_valid=True with no errors."""
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(VALID_PROPERTIES)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is True
    assert errors == []
    assert summary["total_errors"] == 0
    assert summary["fields_with_errors"] == []


def test_missing_required_column_fails_fast():
    """If a required DBF column is absent the validator returns immediately
    without scanning any rows."""
    schema_without_category = {k: v for k, v in VALID_SCHEMA.items() if k != _DBF["category"]}
    collection = _FakeCollection(
        schema_props=schema_without_category,
        features=[_feature(VALID_PROPERTIES)],  # row would be fine but never reached
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is False
    assert len(errors) == 1
    assert errors[0]["error_type"] == "missing_column"
    assert errors[0]["dbf_column"] == _DBF["category"]
    assert errors[0]["feature_index"] is None


@patch("submit_api.services.geo.validator.VALIDATE_VALUES", True)
def test_missing_required_value_fails():
    """A null/empty value in a non-nullable field produces a missing_value error."""
    props = {**VALID_PROPERTIES, _DBF["footprint"]: None}
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(props)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is False
    assert any(
        e["error_type"] == "missing_value" and e["dbf_column"] == _DBF["footprint"]
        for e in errors
    )
    assert "footprint" in summary["fields_with_errors"]


@patch("submit_api.services.geo.validator.VALIDATE_VALUES", False)
def test_values_disabled_skips_row_checks():
    """With value validation off, a file with all required columns passes even
    when row values are out of spec (only column presence is enforced)."""
    out_of_spec = {**VALID_PROPERTIES, _DBF["category"]: "Project Notification", _DBF["footprint"]: None}
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(out_of_spec)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is True
    assert errors == []
    assert summary["total_errors"] == 0


@patch("submit_api.services.geo.validator.VALIDATE_VALUES", True)
def test_invalid_code_fails():
    """A value that is not in the allowed set produces an invalid_code error."""
    props = {**VALID_PROPERTIES, _DBF["category"]: "INVALID"}
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(props)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is False
    assert any(
        e["error_type"] == "invalid_code"
        and e["dbf_column"] == _DBF["category"]
        and e["value"] == "INVALID"
        for e in errors
    )
    assert "category" in summary["fields_with_errors"]


@patch("submit_api.services.geo.validator.VALIDATE_VALUES", True)
def test_sensitive_data_empty_passes():
    """An empty Sensitive Data value is valid because the field is nullable."""
    props = {**VALID_PROPERTIES, _DBF["sensitive_data"]: None}
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(props)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is True
    assert errors == []


@patch("submit_api.services.geo.validator.VALIDATE_VALUES", True)
def test_sensitive_data_blank_string_passes():
    """A whitespace-only Sensitive Data value is normalised to None and passes."""
    props = {**VALID_PROPERTIES, _DBF["sensitive_data"]: "   "}
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(props)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is True
    assert errors == []


@patch("submit_api.services.geo.validator.VALIDATE_VALUES", True)
def test_multiple_errors_across_features():
    """Errors from multiple features are all collected (up to MAX_ERRORS)."""
    bad_props = {**VALID_PROPERTIES, _DBF["category"]: "BAD", _DBF["footprint"]: "ALSO_BAD"}
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(bad_props), _feature(VALID_PROPERTIES), _feature(bad_props)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, summary = validate_shapefile("dummy.shp")

    assert is_valid is False
    # 2 bad features × 2 bad fields = 4 errors
    assert summary["total_errors"] == 4
    assert "category" in summary["fields_with_errors"]
    assert "footprint" in summary["fields_with_errors"]


@patch("submit_api.services.geo.validator.VALIDATE_VALUES", True)
def test_whitespace_stripped_from_valid_value():
    """Leading/trailing whitespace in a DBF value is stripped before comparison."""
    props = {**VALID_PROPERTIES, _DBF["category"]: "  PN  "}
    collection = _FakeCollection(
        schema_props=VALID_SCHEMA,
        features=[_feature(props)],
    )
    with patch("submit_api.services.geo.validator.fiona.open", return_value=collection):
        is_valid, errors, _ = validate_shapefile("dummy.shp")

    assert is_valid is True
    assert errors == []
