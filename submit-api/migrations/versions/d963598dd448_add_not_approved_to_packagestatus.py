"""Add NOT_APPROVED to packagestatus

Revision ID: d963598dd448
Revises: 1585f55d0118
Create Date: 2026-05-21 13:16:19.183024

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd963598dd448'
down_revision = '1585f55d0118'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'NOT_APPROVED';")


def downgrade():
    pass
