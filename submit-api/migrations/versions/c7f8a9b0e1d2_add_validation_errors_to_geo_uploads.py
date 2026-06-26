"""Add validation_errors column to geo_data_uploads

Revision ID: c7f8a9b0e1d2
Revises: 5119a43fc059
Create Date: 2026-06-24 00:00:00.000000

Adds a JSON column to store structured per-feature attribute validation errors
produced by geo_validator.validate_geo_file(). A separate 'validation_failed'
status string (not stored in this column) distinguishes attribute-validation
failures from conversion failures ('failed').
"""
from alembic import op
import sqlalchemy as sa


revision = 'c7f8a9b0e1d2'
down_revision = '5119a43fc059'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'geo_data_uploads',
        sa.Column('validation_errors', sa.JSON(), nullable=True),
    )


def downgrade():
    op.drop_column('geo_data_uploads', 'validation_errors')
