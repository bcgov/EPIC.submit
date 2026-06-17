"""Add additional item statuses

Revision ID: 5119a43fc059
Revises: 00f63e6d1384
Create Date: 2026-06-14 22:15:37.978120

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5119a43fc059'
down_revision = '00f63e6d1384'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED';")
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'NOT_APPROVED';")
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'WITHDRAWN';")


def downgrade():
    pass
