"""add not_applicable to itemstatus

Revision ID: 00f63e6d1384
Revises: 861b5e7374e0
Create Date: 2026-06-11 16:28:46.704817

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '00f63e6d1384'
down_revision = '861b5e7374e0'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'NOT_APPLICABLE';")


def downgrade():
    pass
