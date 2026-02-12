"""add SPECIFIC_PROJECT_ADMIN role

Revision ID: 3909b5d64403
Revises: e9ede8ab9185
Create Date: 2026-02-12 14:24:14.669903

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3909b5d64403'
down_revision = 'e9ede8ab9185'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
       INSERT INTO roles (role_name, label, description, created_date) VALUES 
       ('SPECIFIC_PROJECT_ADMIN', 'Project Administrator - Specific Projects', 'Can manage only assigned projects', NOW())
    """)


def downgrade():
    op.execute("""
    DELETE FROM roles WHERE role_name = 'SPECIFIC_PROJECT_ADMIN'
    """)
