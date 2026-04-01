"""Add REQUESTED_BY_EAO package status

Revision ID: 77862b346adf
Revises: e27054af162b
Create Date: 2026-03-02 16:02:40.724455

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '77862b346adf'
down_revision = 'f1d8ab8c2d30'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'REQUESTED_BY_EAO';")

def downgrade():
    pass