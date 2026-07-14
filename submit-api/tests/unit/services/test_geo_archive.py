"""Unit tests for safe geospatial archive extraction."""
from __future__ import annotations

import zipfile

import pytest

from submit_api.services.geo.archive import find_shapefiles, safe_extract_zip


def test_safe_extract_zip_rejects_path_traversal(tmp_path):
    """Zip members cannot write outside the extraction directory."""
    archive_path = tmp_path / "bad.zip"
    with zipfile.ZipFile(archive_path, "w") as zip_ref:
        zip_ref.writestr("../outside.shp", "bad")

    with pytest.raises(ValueError, match="Unsafe path"):
        safe_extract_zip(str(archive_path), str(tmp_path / "extract"))


def test_safe_extract_zip_rejects_large_expanded_size(tmp_path):
    """Expanded zip size is checked before files are written."""
    archive_path = tmp_path / "large.zip"
    with zipfile.ZipFile(archive_path, "w") as zip_ref:
        zip_ref.writestr("layer.shp", "x" * 20)

    with pytest.raises(ValueError, match="too large"):
        safe_extract_zip(str(archive_path), str(tmp_path / "extract"), max_total_size=10)


def test_find_shapefiles_enforces_count_limit(tmp_path):
    """Zip uploads cannot contain an unbounded number of shapefiles."""
    (tmp_path / "one.shp").write_text("one", encoding="utf-8")
    (tmp_path / "nested").mkdir()
    (tmp_path / "nested" / "two.shp").write_text("two", encoding="utf-8")

    with pytest.raises(ValueError, match="too many shapefiles"):
        find_shapefiles(str(tmp_path), max_shapefiles=1)
