""" Add aggregated_item_statuses column to packages

Revision ID: 93d4a76d7623
Revises: 4af4f616da89
Create Date: 2024-10-11 14:23:35.950224

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = '93d4a76d7623'
down_revision = '4af4f616da89'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.add_column(sa.Column('aggregated_item_statuses', sa.ARRAY(sa.Enum('IN_REVIEW', 'APPROVED', 'REJECTED', 'SUBMITTED', name='packagestatus')), nullable=True))

    op.execute("UPDATE packages SET aggregated_item_statuses = ARRAY[status::packagestatus]")
    op.alter_column('packages', 'aggregated_item_statuses', existing_type=sa.ARRAY(sa.Enum('IN_REVIEW', 'APPROVED', 'REJECTED', 'SUBMITTED', name='packagestatus')), nullable=False)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.drop_column('aggregated_item_statuses')

    # ### end Alembic commands ###
