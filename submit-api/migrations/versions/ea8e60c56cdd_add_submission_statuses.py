"""Add submission statuses

Revision ID: ea8e60c56cdd
Revises: 45ae89dd3b17
Create Date: 2026-04-23 07:38:37.406397

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ea8e60c56cdd'
down_revision = '45ae89dd3b17'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE submissiontypestatus ADD VALUE IF NOT EXISTS 'VERIFIED';")
    op.execute("ALTER TYPE submissiontypestatus ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED';")


def downgrade():
    pass
