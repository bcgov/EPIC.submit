"""Add decision date to package

Revision ID: 1585f55d0118
Revises: 0a91b52dc3b1
Create Date: 2026-05-15 10:37:00.732673

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1585f55d0118'
down_revision = '0a91b52dc3b1'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.add_column(sa.Column('decision_date',  sa.DateTime(), nullable=True))

def downgrade():
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.drop_column('decision_date')
