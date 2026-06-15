"""WITHDRAWN status to package

Revision ID: 0a6fec72a0ae
Revises: 5119a43fc059
Create Date: 2026-06-15 11:08:28.644773

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0a6fec72a0ae'
down_revision = '5119a43fc059'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'WITHDRAWN';")


def downgrade():
    pass

