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
"""Disk-based GDAL/OGR converter for geospatial uploads."""
from __future__ import annotations

import json
import logging
import math
import multiprocessing
import os
import resource
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path
from queue import Empty
from typing import Any, Dict

import fiona
from fiona.model import to_dict
from shapely.geometry import shape

from submit_api.services.geo.archive import find_shapefiles, safe_extract_zip


logger = logging.getLogger(__name__)

COLOR_PALETTE = [
    ("#FF00FF", "#8B008B"),  # Neon Magenta
    ("#00FFFF", "#008B8B"),  # Neon Cyan
    ("#FF1493", "#C71585"),  # Deep Pink
    ("#39FF14", "#008000"),  # Neon Green
    ("#FF4500", "#B22222"),  # Orange Red
    ("#9400D3", "#4B0082"),  # Dark Violet
    ("#FFFF00", "#B8860B"),  # Bright Yellow
    ("#FF007F", "#80003F"),  # Rose
    ("#00FF00", "#006400"),  # Lime
    ("#8A2BE2", "#483D8B"),  # Blue Violet
]

OUTPUT_LAYER_NAME = "features"

# Preview files are meant for quick browser rendering, not authoritative GIS
# analysis. Simplification is done after the standard layer has already been
# converted to WGS84, so the tolerance is in degrees and intentionally small.
PREVIEW_SIMPLIFICATION = float(os.environ.get("GEO_PREVIEW_SIMPLIFICATION", "0.000001"))

# Cap the number of features copied into preview output. The standard tier still
# contains all features; this only keeps map previews responsive for large
# uploads.
PREVIEW_MAX_FEATURES = int(os.environ.get("GEO_PREVIEW_MAX_FEATURES", 10_000))

# Maximum size for each generated GeoJSON tier. This catches unexpectedly large
# outputs before they are uploaded to object storage and before the frontend is
# asked to fetch/render them.
GEO_MAX_OUTPUT_BYTES = int(os.environ.get("GEO_MAX_OUTPUT_BYTES", 500 * 1024 * 1024))

# Hard wall-clock limit for a GIS conversion job. The subprocess-level timeout
# limits each GDAL command; process_geo_file_with_timeout also enforces this at
# the worker-process level so a stuck conversion can be terminated.
GEO_PROCESSING_TIMEOUT_SECONDS = int(os.environ.get("GEO_PROCESSING_TIMEOUT_SECONDS", 60))


def _quote_identifier(value: str) -> str:
    """Quote an OGR SQL identifier."""
    return '"' + value.replace('"', '""') + '"'


def _quote_literal(value: str) -> str:
    """Quote an OGR SQL string literal."""
    return "'" + value.replace("'", "''") + "'"


def _run_command(cmd: list[str], timeout_seconds: int = GEO_PROCESSING_TIMEOUT_SECONDS) -> None:
    """Run a GDAL command and raise a concise error on failure."""
    try:
        result = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            # Some shapefile uploads omit or damage the .shx index. GDAL can
            # rebuild it when this flag is set, which makes the converter more
            # tolerant without changing the uploaded source archive.
            env={**os.environ, "SHAPE_RESTORE_SHX": "YES"},
            text=True,
            timeout=timeout_seconds,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("GDAL command not found. Install gdal-bin so ogr2ogr is available.") from exc
    except subprocess.TimeoutExpired as exc:
        raise TimeoutError(f"GDAL conversion timed out after {timeout_seconds} seconds.") from exc

    if result.returncode != 0:
        details = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(f"GDAL conversion failed: {details}")


def _format_crs(src: fiona.Collection) -> str:
    """Return a compact CRS name for metadata."""
    if src.crs:
        to_string = getattr(src.crs, "to_string", None)
        return to_string() if callable(to_string) else str(src.crs)
    return "Unknown"


def _get_source_info(shp_path: str) -> tuple[str, str]:
    """Return the OGR layer name and original CRS for a shapefile."""
    with fiona.open(shp_path) as src:
        return src.name or Path(shp_path).stem, _format_crs(src)


def _convert_source_to_standard(shp_path: str, output_path: str, layer_index: int) -> str:
    """Convert one shapefile to a WGS84 GeoJSON layer and add map styling fields."""
    source_layer_name, crs_original = _get_source_info(shp_path)
    fill_color, stroke_color = COLOR_PALETTE[layer_index % len(COLOR_PALETTE)]

    # Add frontend styling fields inside OGR's SQL projection so feature
    # properties are preserved and Python never has to load the layer into a
    # GeoDataFrame just to decorate each feature.
    sql = (
        "SELECT *, "
        f"{_quote_literal(fill_color)} AS layer_color, "
        f"{_quote_literal(stroke_color)} AS stroke_color, "
        f"{_quote_literal(Path(shp_path).name)} AS layer_name "
        f"FROM {_quote_identifier(source_layer_name)}"
    )

    cmd = [
        "ogr2ogr",
        "-f",
        "GeoJSON",
        "-lco",
        "RFC7946=YES",
        "-nln",
        OUTPUT_LAYER_NAME,
        "-dialect",
        "SQLite",
        "-sql",
        sql,
    ]
    if crs_original == "Unknown":
        # Without a .prj file GDAL cannot safely reproject coordinates. The old
        # path treated missing CRS as WGS84, so keep that compatibility by
        # assigning EPSG:4326 rather than transforming unknown coordinates.
        logger.warning("No CRS found in file %s (missing .prj?). Assuming EPSG:4326.", shp_path)
        cmd.extend(["-a_srs", "EPSG:4326"])
    else:
        cmd.extend(["-t_srs", "EPSG:4326"])

    cmd.extend([output_path, shp_path])
    _run_command(cmd)
    _check_output_size(output_path)
    return crs_original


def _convert_standard_to_preview(standard_path: str, output_path: str, feature_limit: int) -> None:
    """Create one simplified preview layer from an already-WGS84 GeoJSON layer."""
    sql = f"SELECT * FROM {_quote_identifier(OUTPUT_LAYER_NAME)} LIMIT {feature_limit}"
    cmd = [
        "ogr2ogr",
        "-f",
        "GeoJSON",
        "-lco",
        "RFC7946=YES",
        "-nln",
        OUTPUT_LAYER_NAME,
        "-simplify",
        str(PREVIEW_SIMPLIFICATION),
        "-dialect",
        "SQLite",
        "-sql",
        sql,
        output_path,
        standard_path,
    ]
    _run_command(cmd)
    _check_output_size(output_path)


def _check_output_size(path: str) -> None:
    """Reject generated GeoJSON files that exceed the configured output limit."""
    size = os.path.getsize(path)
    if size > GEO_MAX_OUTPUT_BYTES:
        raise ValueError(f"Generated GeoJSON is too large ({size} bytes > {GEO_MAX_OUTPUT_BYTES} bytes).")


def _merge_geojson_files(source_paths: list[str], output_path: str) -> None:
    """Merge GeoJSON FeatureCollections into one output file without byte buffering."""
    with open(output_path, "w", encoding="utf-8") as target:
        target.write('{"type":"FeatureCollection","features":[')
        first_feature = True
        for source_path in source_paths:
            with fiona.open(source_path) as source:
                for feature in source:
                    if not first_feature:
                        target.write(",")
                    # Write one feature at a time so multi-layer uploads do not
                    # accumulate full GeoJSON payloads in process memory.
                    json.dump(to_dict(feature), target, allow_nan=False, separators=(",", ":"))
                    first_feature = False
        target.write("]}")
    _check_output_size(output_path)


def _clamp_bbox(bounds: tuple[float, float, float, float] | None) -> list[float]:
    """Clamp a WGS84 bounds tuple to a frontend-safe bbox."""
    if not bounds:
        return [0.0, 0.0, 0.0, 0.0]

    bbox: list[float] = []
    for index, value in enumerate(bounds):
        if not math.isfinite(value):
            logger.warning("Invalid coordinate detected in bounds: %s. Using default bbox.", value)
            return [-180.0, -90.0, 180.0, 90.0]

        if index % 2 == 0:
            bbox.append(float(max(-180, min(180, value))))
        else:
            bbox.append(float(max(-90, min(90, value))))
    return bbox


def _merge_bounds(
    current_bounds: list[float] | None,
    geom_bounds: tuple[float, float, float, float],
) -> list[float]:
    """Return cumulative bounds after adding one geometry bounds tuple."""
    if current_bounds is None:
        return [geom_bounds[0], geom_bounds[1], geom_bounds[2], geom_bounds[3]]
    return [
        min(current_bounds[0], geom_bounds[0]),
        min(current_bounds[1], geom_bounds[1]),
        max(current_bounds[2], geom_bounds[2]),
        max(current_bounds[3], geom_bounds[3]),
    ]


def _get_geojson_metadata(standard_path: str, crs_original: str) -> Dict[str, Any]:
    """Read final GeoJSON metadata one feature at a time."""
    geometry_counts: Counter[str] = Counter()
    bounds: list[float] | None = None
    feature_count = 0

    with fiona.open(standard_path) as source:
        for feature in source:
            feature_count += 1
            geometry = to_dict(feature).get("geometry")
            if not geometry:
                continue
            geometry_counts[geometry.get("type", "Unknown")] += 1
            geom_bounds = shape(geometry).bounds
            bounds = _merge_bounds(bounds, geom_bounds)

    geometry_type = geometry_counts.most_common(1)[0][0] if geometry_counts else "Unknown"
    return {
        "feature_count": feature_count,
        "geometry_type": geometry_type,
        "crs_original": crs_original,
        "bbox": _clamp_bbox(tuple(bounds) if bounds else None),
    }


def _resolve_shapefiles(local_path: str, output_dir: str) -> list[str]:
    """Return shapefiles to convert, extracting zip uploads when needed."""
    if local_path.lower().endswith(".shp"):
        return [local_path]

    if local_path.lower().endswith(".zip"):
        extract_dir = os.path.join(output_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)
        safe_extract_zip(local_path, extract_dir)
        shapefiles = find_shapefiles(extract_dir)
        if not shapefiles:
            raise ValueError("No .shp files found inside the zip archive.")
        return shapefiles

    raise ValueError(f"Unsupported file extension for conversion: {os.path.basename(local_path)}")


def _summarize_crs(crs_values: list[str]) -> str:
    """Return a stable CRS summary for one or more input layers."""
    unique_values = [value for index, value in enumerate(crs_values) if value not in crs_values[:index]]
    if not unique_values:
        return "Unknown"
    if len(unique_values) == 1:
        return unique_values[0]
    return "Mixed: " + ", ".join(unique_values)


def _convert_layers(shapefiles: list[str], layer_dir: str) -> tuple[list[str], list[str], list[str]]:
    """Convert source shapefiles into per-layer standard and preview outputs."""
    standard_parts: list[str] = []
    preview_parts: list[str] = []
    crs_values: list[str] = []
    remaining_preview_features = PREVIEW_MAX_FEATURES

    for index, shapefile in enumerate(shapefiles):
        standard_part = os.path.join(layer_dir, f"standard-{index}.geojson")
        crs_values.append(_convert_source_to_standard(shapefile, standard_part, index))
        standard_parts.append(standard_part)

        if remaining_preview_features > 0:
            preview_part = os.path.join(layer_dir, f"preview-{index}.geojson")
            _convert_standard_to_preview(standard_part, preview_part, remaining_preview_features)
            preview_parts.append(preview_part)
            with fiona.open(preview_part) as preview_source:
                remaining_preview_features -= len(preview_source)

    return standard_parts, preview_parts, crs_values


def process_geo_file(local_path: str, output_dir: str | None = None) -> Dict[str, Any]:
    """Process a .shp or .zip into preview/standard GeoJSON files plus metadata."""
    output_root = output_dir or tempfile.mkdtemp(prefix="geo-processed-")
    os.makedirs(output_root, exist_ok=True)

    shapefiles = _resolve_shapefiles(local_path, output_root)
    layer_dir = os.path.join(output_root, "layers")
    os.makedirs(layer_dir, exist_ok=True)
    standard_parts, preview_parts, crs_values = _convert_layers(shapefiles, layer_dir)

    standard_output = os.path.join(output_root, "standard.geojson")
    preview_output = os.path.join(output_root, "preview.geojson")
    _merge_geojson_files(standard_parts, standard_output)
    _merge_geojson_files(preview_parts, preview_output)

    crs_original = _summarize_crs(crs_values)
    return {
        "tiers": {
            "preview": preview_output,
            "standard": standard_output,
        },
        "metadata": _get_geojson_metadata(standard_output, crs_original),
    }


def _max_rss_to_mb(max_rss: int) -> float:
    """Convert ru_maxrss to MB; Linux reports KB, macOS reports bytes."""
    divisor = 1024 * 1024 if sys.platform == "darwin" else 1024
    return round(max_rss / divisor, 2)


def _get_resource_usage() -> Dict[str, Any]:
    """Return best-effort CPU and memory use for this worker and its GDAL subprocesses."""
    self_usage = resource.getrusage(resource.RUSAGE_SELF)
    child_usage = resource.getrusage(resource.RUSAGE_CHILDREN)
    return {
        "user_cpu_seconds": round(self_usage.ru_utime + child_usage.ru_utime, 3),
        "system_cpu_seconds": round(self_usage.ru_stime + child_usage.ru_stime, 3),
        "max_rss_mb": _max_rss_to_mb(max(self_usage.ru_maxrss, child_usage.ru_maxrss)),
    }


def _process_geo_file_worker(
    local_path: str,
    output_dir: str,
    result_queue: "multiprocessing.Queue",
) -> None:
    """Child-process entry point for timeout-controlled conversion."""
    try:
        result = process_geo_file(local_path, output_dir)
        result["resource_usage"] = _get_resource_usage()
        result_queue.put(("ok", result))
    except Exception as exc:  # pylint: disable=broad-except # noqa: B902
        result_queue.put(("error", str(exc)))


def process_geo_file_with_timeout(
    local_path: str,
    output_dir: str,
    timeout_seconds: int = GEO_PROCESSING_TIMEOUT_SECONDS,
) -> Dict[str, Any]:
    """Run process_geo_file in a child process, enforcing a hard wall-clock timeout."""
    ctx = multiprocessing.get_context()
    result_queue: "multiprocessing.Queue" = ctx.Queue()

    # Run conversion in a separate process instead of the request/background
    # thread so a timeout can terminate GDAL/Fiona work cleanly and release the
    # worker process resources.
    proc = ctx.Process(
        target=_process_geo_file_worker,
        args=(local_path, output_dir, result_queue),
        daemon=True,
    )
    proc.start()

    try:
        status, payload = result_queue.get(timeout=timeout_seconds)
    except Empty as exc:
        logger.warning(
            "Geospatial processing exceeded %ss for %s; terminating worker process.",
            timeout_seconds, local_path,
        )
        proc.terminate()
        proc.join(timeout=5)
        if proc.is_alive():
            proc.kill()
        raise TimeoutError(
            f"Processing timed out after {timeout_seconds} seconds and was stopped."
        ) from exc
    finally:
        result_queue.close()

    proc.join(timeout=5)

    if status == "error":
        raise RuntimeError(payload)
    return payload
