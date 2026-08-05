"""access timstamps at userrole table

Revision ID: 9b50b1ec9f42
Revises: c9c6a80616a7
Create Date: 2026-07-31 11:42:30.724134

"""
from datetime import datetime, UTC

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9b50b1ec9f42'
down_revision = 'c9c6a80616a7'
branch_labels = None
depends_on = None


def upgrade():
    """Add access_start and access_end columns, backfill from created_date. Add ACCESS_REVOKED status."""
    op.add_column('user_roles', sa.Column('access_start', sa.DateTime(), nullable=True))
    op.add_column('user_roles', sa.Column('access_end', sa.DateTime(), nullable=True))

    # Backfill: set access_start = created_date for existing rows
    op.execute("UPDATE user_roles SET access_start = created_date WHERE access_start IS NULL")

    # Now make access_start NOT NULL
    op.alter_column('user_roles', 'access_start', nullable=False)

    # Add ACCESS_REVOKED user status
    user_status = sa.table('user_status',
                           sa.column('id', sa.Integer),
                           sa.column('status_name', sa.String),
                           sa.column('description', sa.String),
                           sa.column('created_date', sa.DateTime),
                           sa.column('updated_date', sa.DateTime))

    op.bulk_insert(user_status, [
        {
            'id': 3,
            'status_name': 'ACCESS_REVOKED',
            'description': 'Access Revoked',
            'created_date': datetime.now(UTC),
            'updated_date': datetime.now(UTC),
        }
    ])


def downgrade():
    """Remove access_start and access_end columns. Remove ACCESS_REVOKED status."""
    op.drop_column('user_roles', 'access_end')
    op.drop_column('user_roles', 'access_start')

    # Remove ACCESS_REVOKED status
    op.execute("DELETE FROM user_status WHERE id = 3")
