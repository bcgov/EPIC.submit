"""add in_progress status in package model

Revision ID: e77a59c88dac
Revises: d4ea378228e4
Create Date: 2026-04-15 17:41:20.993941

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e77a59c88dac'
down_revision = 'd4ea378228e4'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'IN_PROGRESS';")


def downgrade():
    # Note: PostgreSQL does not support removing enum values directly
    # This would require recreating the enum type, which is complex and risky
    # If rollback is needed, it should be done manually or with a new migration
    pass
