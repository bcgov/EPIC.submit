"""add_specific_project_admin_role

Revision ID: 0d2911c8aea0
Revises: 2656a9b67883
Create Date: 2026-02-12 16:54:23.374905

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0d2911c8aea0'
down_revision = '2656a9b67883'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
       INSERT INTO roles (role_name, label, description, created_date) VALUES 
       ('SPECIFIC_PROJECT_ADMIN', 'Project Administrator - Specific Projects', 'Can manage only assigned projects', NOW())
    """)


def downgrade():
    op.execute("""
    DELETE FROM invitations WHERE role_id = (SELECT id FROM roles WHERE role_name = 'SPECIFIC_PROJECT_ADMIN');
    DELETE FROM roles WHERE role_name = 'SPECIFIC_PROJECT_ADMIN';
    """)
