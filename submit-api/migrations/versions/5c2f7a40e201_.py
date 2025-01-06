""" Add new status to package and item

Revision ID: 5c2f7a40e201
Revises: 910c8029a678
Create Date: 2024-12-24 10:54:04.654294
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "5c2f7a40e201"
down_revision = "910c8029a678"
branch_labels = None
depends_on = None


def upgrade():
    def upgrade():
        op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';")
        op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'UNDER_CONSULTATION_CHECK';")
        op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';")
        op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'UNDER_CONSULTATION_CHECK';")


def downgrade():
    pass
