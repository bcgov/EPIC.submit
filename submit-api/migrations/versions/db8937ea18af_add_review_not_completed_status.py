"""Add REVIEW_NOT_COMPLETED package status

Revision ID: db8937ea18af
Revises: 77862b346adf
Create Date: 2026-03-27 09:03:51.152279

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'db8937ea18af'
down_revision = '4eab27236b2a'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'REVIEW_NOT_COMPLETED';")
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'REVIEW_NOT_COMPLETED';")


def downgrade():
    pass
