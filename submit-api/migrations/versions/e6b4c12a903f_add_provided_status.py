"""Add Provided status for N/A management plans.

Revision ID: e6b4c12a903f
Revises: a4c8e2f6b0d1
"""
from alembic import op

revision = 'e6b4c12a903f'
down_revision = 'a4c8e2f6b0d1'
branch_labels = None
depends_on = None


def upgrade():
    """Add the package and item completion status."""
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'PROVIDED'")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'PROVIDED'")


def downgrade():
    """Retain enum values so existing Provided submissions remain readable."""
