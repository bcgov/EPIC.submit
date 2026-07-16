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
"""Geospatial processing package.

Public surface:
  GeoService          — orchestration layer (create, list, retry uploads)
  process_geo_file    — converts a .shp/.zip into tiered GeoJSON
  validate_geo_file   — validates shapefile attributes before conversion
"""
from submit_api.services.geo.ogr_converter import process_geo_file
from submit_api.services.geo.processor import GeoService
from submit_api.services.geo.validator import validate_geo_file

__all__ = ["GeoService", "process_geo_file", "validate_geo_file"]
