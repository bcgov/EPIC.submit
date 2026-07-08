"""Add REVISION_REQUIRED to submissionreviewstatus

Revision ID: 8bc9fafd24f1
Revises: 6319d2b3933e
Create Date: 2026-07-07 12:54:15.764392

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8bc9fafd24f1'
down_revision = '6319d2b3933e'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.add_column(sa.Column('enforceable', sa.Boolean(), nullable=False, server_default='false'))
    op.execute("ALTER TYPE submissionreviewstatus ADD VALUE IF NOT EXISTS 'REVISION_REQUIRED';")
    op.execute("ALTER TYPE submissiontypestatus ADD VALUE IF NOT EXISTS 'REVISION_REQUIRED';")
    op.execute("ALTER TYPE itemstatus ADD VALUE IF NOT EXISTS 'REVISION_REQUIRED';")



def downgrade():
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.drop_column('enforceable')
