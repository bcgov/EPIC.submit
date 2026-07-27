"""add payload to email queue

Revision ID: f2a7b3c4d5e6
Revises: a1c2d3e4f5a6
Create Date: 2026-06-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'f2a7b3c4d5e6'
down_revision = 'a1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('email_queue', schema=None) as batch_op:
        batch_op.add_column(sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade():
    with op.batch_alter_table('email_queue', schema=None) as batch_op:
        batch_op.drop_column('payload')
