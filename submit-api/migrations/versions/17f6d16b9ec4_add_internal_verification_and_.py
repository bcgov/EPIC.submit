"""add internal_verification and acknowledged to packagestatus

Revision ID: 17f6d16b9ec4
Revises: 9232989dd92d
Create Date: 2026-04-30 14:54:40.406851

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '17f6d16b9ec4'
down_revision = '9232989dd92d'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'INTERNAL_VERIFICATION';")
    op.execute("ALTER TYPE packagestatus ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED';")


def downgrade():
    pass
