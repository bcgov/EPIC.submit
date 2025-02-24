"""Remove FAILED_CONSULTATION_CHECK status from package and item

Revision ID: 357e22a9cf8f
Revises: 705145d0cf36
Create Date: 2025-02-24 11:44:48.187230

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '357e22a9cf8f'
down_revision = '705145d0cf36'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE items SET status = 'UNDER_CONSULTATION_CHECK' WHERE status = 'FAILED_CONSULTATION_CHECK';")

    op.execute("ALTER TYPE packagestatus RENAME VALUE 'AWAITING_MANAGER_REVIEW' TO 'AWAITING_MANAGER_APPROVAL';")
    op.execute("ALTER TYPE itemstatus RENAME VALUE 'AWAITING_MANAGER_REVIEW' TO 'AWAITING_MANAGER_APPROVAL';")
    op.execute("ALTER TYPE packagestatus RENAME VALUE 'CC_AWAITING_MANAGER_REVIEW' TO 'CC_AWAITING_MANAGER_APPROVAL';")
    op.execute("ALTER TYPE itemstatus RENAME VALUE 'CC_AWAITING_MANAGER_REVIEW' TO 'CC_AWAITING_MANAGER_APPROVAL';")
    op.execute("ALTER TYPE packagestatus RENAME VALUE 'MP_AWAITING_MANAGER_REVIEW' TO 'MP_AWAITING_MANAGER_APPROVAL';")
    op.execute("ALTER TYPE itemstatus RENAME VALUE 'MP_AWAITING_MANAGER_REVIEW' TO 'MP_AWAITING_MANAGER_APPROVAL';")


def downgrade():
    pass
