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
    op.execute("CREATE TYPE packageapprovaltype AS ENUM ('A', 'B', 'C')")

    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.add_column(sa.Column('approval_type', sa.Enum('A', 'B', 'C', name='packageapprovaltype')))


def downgrade():
    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.drop_column('approval_type')

    op.execute("DROP TYPE packageapprovaltype")
