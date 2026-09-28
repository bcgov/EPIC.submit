"""add last_login_at to account_users

Revision ID: f2a7c1d9e4b3
Revises: b7f1a2c3d4e5
Create Date: 2026-09-28 10:00:00.000000

Adds a nullable last_login_at timestamp to account_users. It records the most
recent app entry for a proponent (stamped on POST /users/me) and backs an
external inactivity job that deactivates proponents after prolonged inactivity.
Existing rows stay NULL (never logged in under this feature).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f2a7c1d9e4b3'
down_revision = 'b7f1a2c3d4e5'
branch_labels = None
depends_on = None


def upgrade():
    """Add the nullable last_login_at column to account_users."""
    with op.batch_alter_table('account_users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'last_login_at',
                sa.DateTime(),
                nullable=True,
                comment='UTC timestamp of the proponent\'s most recent app entry.'
            )
        )


def downgrade():
    """Remove the last_login_at column from account_users."""
    with op.batch_alter_table('account_users', schema=None) as batch_op:
        batch_op.drop_column('last_login_at')
