"""backfill project id

Revision ID: a98a64e73ffb
Revises: 5ca405e40d35
Create Date: 2025-05-14 07:18:38.023271

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a98a64e73ffb'
down_revision = '30d03b77c562'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
            UPDATE user_roles ur
            SET account_project_id = ap.id
            FROM account_users au
            JOIN account_projects ap ON au.account_id = ap.account_id
            WHERE ur.account_user_id = au.id
            AND ur.account_project_id IS NULL
        """)


def downgrade():
    op.execute("UPDATE user_roles SET account_project_id = NULL")
