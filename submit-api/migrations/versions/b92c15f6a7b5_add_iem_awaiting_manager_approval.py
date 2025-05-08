""" Add IEM_AWAITING_MANAGER_APPROVAL to packagestatus and itemstatus

Revision ID: b92c15f6a7b5
Revises: df4613866744
Create Date: 2025-05-06 16:38:38.938447

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'b92c15f6a7b5'
down_revision = 'df4613866744'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'IEM_AWAITING_MANAGER_APPROVAL';")
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'IEM_AWAITING_MANAGER_APPROVAL';")


def downgrade():
    pass
