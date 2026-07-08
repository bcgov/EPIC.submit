"""Add is_approved column to geo_data_uploads

Revision ID: d4e5f6a7b8c9
Revises: 6319d2b3933e
Create Date: 2026-07-07 00:00:00.000000

Adds a boolean flag recording whether the proponent explicitly approved the
geospatial file in the preview modal. Existing rows default to False so that
previously uploaded (un-reviewed) files must be re-reviewed before the item
can be completed.
"""
from alembic import op
import sqlalchemy as sa


revision = 'd4e5f6a7b8c9'
down_revision = '6319d2b3933e'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'geo_data_uploads',
        sa.Column('is_approved', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_column('geo_data_uploads', 'is_approved')
