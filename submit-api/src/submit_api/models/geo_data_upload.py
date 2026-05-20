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
"""GeoDataUpload model class.

Manages the geo data upload entity.
"""
from __future__ import annotations

from datetime import datetime, UTC

from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text

from .base_model import BaseModel


class GeoDataUpload(BaseModel):
    """Definition of the GeoDataUpload entity."""

    __tablename__ = 'geo_data_uploads'

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=True)  # 'shp' or 'zip'
    file_size_kb = Column(Float, nullable=True)
    raw_s3_key = Column(String(512), nullable=True)
    preview_s3_key = Column(String(512), nullable=True)
    standard_s3_key = Column(String(512), nullable=True)
    status = Column(String(20), nullable=False, default='processing')
    error_message = Column(Text, nullable=True)
    feature_count = Column(Integer, nullable=True)
    geometry_type = Column(String(50), nullable=True)
    crs_original = Column(String(100), nullable=True)
    bbox = Column(JSON, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=True
    )

    def __init__(self, **kwargs):
        """Initialize the geo data upload."""
        super().__init__(**kwargs)

    def to_dict(self):
        """Return a dictionary representation of the model."""
        return {
            'id': self.id,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size_kb': self.file_size_kb,
            'raw_s3_key': self.raw_s3_key,
            'preview_s3_key': self.preview_s3_key,
            'standard_s3_key': self.standard_s3_key,
            'status': self.status,
            'error_message': self.error_message,
            'feature_count': self.feature_count,
            'geometry_type': self.geometry_type,
            'crs_original': self.crs_original,
            'bbox': self.bbox,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
