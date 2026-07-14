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
"""Archive helpers for geospatial uploads."""
from __future__ import annotations

import os
import shutil
import zipfile
from pathlib import Path


DEFAULT_MAX_EXTRACTED_BYTES = int(os.environ.get("GEO_MAX_EXTRACTED_BYTES", 500 * 1024 * 1024))
DEFAULT_MAX_ZIP_MEMBERS = int(os.environ.get("GEO_MAX_ZIP_MEMBERS", 500))
DEFAULT_MAX_SHAPEFILES = int(os.environ.get("GEO_MAX_SHAPEFILES", 20))


def _safe_member_path(target_dir: str, member_name: str) -> Path:
    """Return a safe extraction path for one zip member."""
    normalized_name = member_name.replace("\\", "/")
    parts = Path(normalized_name).parts
    if (
        not normalized_name
        or normalized_name.startswith("/")
        or normalized_name.startswith("\\")
        or (parts and ":" in parts[0])
        or ".." in parts
    ):
        raise ValueError(f"Unsafe path in zip archive: {member_name}")

    base_path = Path(target_dir).resolve()
    target_path = (base_path / normalized_name).resolve()
    if target_path != base_path and base_path not in target_path.parents:
        raise ValueError(f"Unsafe path in zip archive: {member_name}")
    return target_path


def safe_extract_zip(
    zip_path: str,
    target_dir: str,
    max_total_size: int = DEFAULT_MAX_EXTRACTED_BYTES,
    max_members: int = DEFAULT_MAX_ZIP_MEMBERS,
) -> None:
    """Extract a zip file after checking path traversal and expanded size limits."""
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        members = [member for member in zip_ref.infolist() if not member.is_dir()]
        if len(members) > max_members:
            raise ValueError(f"Zip archive contains too many files ({len(members)} > {max_members}).")

        total_size = sum(member.file_size for member in members)
        if total_size > max_total_size:
            raise ValueError(
                "Zip archive is too large after extraction "
                f"({total_size} bytes > {max_total_size} bytes)."
            )

        for member in members:
            target_path = _safe_member_path(target_dir, member.filename)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with zip_ref.open(member) as source, open(target_path, "wb") as target:
                shutil.copyfileobj(source, target)


def find_shapefiles(root_dir: str, max_shapefiles: int = DEFAULT_MAX_SHAPEFILES) -> list[str]:
    """Return sorted shapefile paths under ``root_dir`` and enforce a count limit."""
    shapefiles = sorted(str(path) for path in Path(root_dir).rglob("*.shp") if path.is_file())
    if len(shapefiles) > max_shapefiles:
        raise ValueError(f"Zip archive contains too many shapefiles ({len(shapefiles)} > {max_shapefiles}).")
    return shapefiles
