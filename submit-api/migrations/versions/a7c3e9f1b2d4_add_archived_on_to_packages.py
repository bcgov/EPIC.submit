"""Add archived_on to packages

Revision ID: a7c3e9f1b2d4
Revises: d5a1c7e9b3f2
Create Date: 2026-11-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7c3e9f1b2d4'
down_revision = 'd5a1c7e9b3f2'
branch_labels = None
depends_on = None


def upgrade():
    """Add the archived_on column and its index."""
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'archived_on', sa.DateTime(), nullable=True,
            comment="When the package was archived because its work moved past the package type's phase range"))
        batch_op.create_index('idx_packages_archived_on', ['archived_on'], unique=False)


def downgrade():
    """Drop the archived_on column and its index."""
    with op.batch_alter_table('packages', schema=None) as batch_op:
        batch_op.drop_index('idx_packages_archived_on')
        batch_op.drop_column('archived_on')
