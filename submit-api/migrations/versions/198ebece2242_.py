""" Add type column to update_requests

Revision ID: 198ebece2242
Revises: 1e9b19ace1fa
Create Date: 2024-12-24 12:07:33.177432

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '198ebece2242'
down_revision = '1e9b19ace1fa'
branch_labels = None
depends_on = None


def upgrade():
    # Create the enum type
    op.execute("CREATE TYPE updaterequesttype AS ENUM ('REVIEW', 'UPDATE')")

    # Add the column with a default value
    with op.batch_alter_table('update_requests', schema=None) as batch_op:
        batch_op.add_column(sa.Column('type', sa.Enum('REVIEW', 'UPDATE', name='updaterequesttype'), nullable=False,
                                      server_default='UPDATE'))

    # Remove the default value constraint
    with op.batch_alter_table('update_requests', schema=None) as batch_op:
        batch_op.alter_column('type', server_default=None)


def downgrade():
    # Drop the column
    with op.batch_alter_table('update_requests', schema=None) as batch_op:
        batch_op.drop_column('type')

    # Drop the enum type
    op.execute("DROP TYPE updaterequesttype")
    # ### end Alembic commands ###
