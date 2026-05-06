"""Add package statuses required for type c submissions

Revision ID: 0a91b52dc3b1
Revises: 9232989dd92d
Create Date: 2026-05-05 20:42:24.402546

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0a91b52dc3b1'
down_revision = '9232989dd92d'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'INTERNAL_VERIFICATION';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'VERIFIED';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'PENDING_ACKNOWLEDGEMENT';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'READY_FOR_ACKNOWLEDGEMENT';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'UPDATE_REQUESTED';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'UPDATED';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'READY_FOR_APPROVAL';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'READY_FOR_APPROVAL';")


def downgrade():
    pass
