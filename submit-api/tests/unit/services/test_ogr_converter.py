"""Unit tests for the disk-based OGR converter."""
from __future__ import annotations

import json
from unittest.mock import patch

from submit_api.services.geo import ogr_converter


def _feature(feature_id: int) -> dict:
    return {
        "type": "Feature",
        "properties": {"id": feature_id},
        "geometry": {"type": "Point", "coordinates": [feature_id, feature_id]},
    }


def _write_geojson(path, features: list[dict]) -> None:
    path.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}),
        encoding="utf-8",
    )


def test_merge_geojson_files_streams_features_into_one_collection(tmp_path):
    """Multiple layer outputs are merged into one FeatureCollection."""
    import sys
    from types import ModuleType
    from unittest.mock import MagicMock

    first = tmp_path / "first.geojson"
    second = tmp_path / "second.geojson"
    output = tmp_path / "merged.geojson"
    _write_geojson(first, [_feature(1)])
    _write_geojson(second, [_feature(2)])

    # Create a mock fiona module that reads GeoJSON files natively
    fiona_mock = MagicMock(spec=ModuleType)

    def _fiona_open(path):
        """Return a context manager yielding features from a GeoJSON file."""
        data = json.loads(open(path, encoding="utf-8").read())
        features = data.get("features", [])
        ctx = MagicMock()
        ctx.__enter__ = lambda self: features
        ctx.__exit__ = lambda self, *a: None
        return ctx

    fiona_mock.open = _fiona_open

    fiona_model_mock = MagicMock(spec=ModuleType)
    fiona_model_mock.to_dict = lambda f: f  # identity: features are already dicts

    with patch.dict(sys.modules, {"fiona": fiona_mock, "fiona.model": fiona_model_mock}):
        ogr_converter._merge_geojson_files([str(first), str(second)], str(output))

    merged = json.loads(output.read_text(encoding="utf-8"))
    assert merged["type"] == "FeatureCollection"
    assert [feature["properties"]["id"] for feature in merged["features"]] == [1, 2]


def test_convert_source_to_standard_reprojects_known_crs(tmp_path):
    """Known source CRS uses -t_srs so coordinates are transformed to WGS84."""
    output_path = tmp_path / "standard.geojson"

    with patch.object(ogr_converter, "_get_source_info", return_value=("InputLayer", "EPSG:3005")), \
            patch.object(ogr_converter, "_run_command") as run_command, \
            patch.object(ogr_converter, "_check_output_size"):
        crs = ogr_converter._convert_source_to_standard("/tmp/input.shp", str(output_path), 0)

    cmd = run_command.call_args.args[0]
    assert crs == "EPSG:3005"
    assert "-t_srs" in cmd
    assert "EPSG:4326" in cmd
    assert "-a_srs" not in cmd
    assert "layer_color" in cmd[cmd.index("-sql") + 1]
    assert "input.shp" in cmd[cmd.index("-sql") + 1]


def test_convert_source_to_standard_assigns_unknown_crs(tmp_path):
    """Missing source CRS keeps the existing assumption that coordinates are WGS84."""
    output_path = tmp_path / "standard.geojson"

    with patch.object(ogr_converter, "_get_source_info", return_value=("InputLayer", "Unknown")), \
            patch.object(ogr_converter, "_run_command") as run_command, \
            patch.object(ogr_converter, "_check_output_size"):
        crs = ogr_converter._convert_source_to_standard("/tmp/input.shp", str(output_path), 0)

    cmd = run_command.call_args.args[0]
    assert crs == "Unknown"
    assert "-a_srs" in cmd
    assert "EPSG:4326" in cmd
    assert "-t_srs" not in cmd


def test_convert_standard_to_preview_simplifies_wgs84_geojson(tmp_path):
    """Preview conversion runs against the already converted WGS84 GeoJSON layer."""
    standard_path = tmp_path / "standard.geojson"
    preview_path = tmp_path / "preview.geojson"

    with patch.object(ogr_converter, "_run_command") as run_command, \
            patch.object(ogr_converter, "_check_output_size"):
        ogr_converter._convert_standard_to_preview(str(standard_path), str(preview_path), 100)

    cmd = run_command.call_args.args[0]
    assert "-simplify" in cmd
    assert str(ogr_converter.PREVIEW_SIMPLIFICATION) in cmd
    assert "LIMIT 100" in cmd[cmd.index("-sql") + 1]
    assert str(preview_path) in cmd
    assert str(standard_path) in cmd
