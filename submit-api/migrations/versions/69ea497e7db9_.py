""" Rename the account_roles table to account_user_roles

Revision ID: 69ea497e7db9
Revises: f9abaf338ea0
Create Date: 2024-12-16 10:35:38.654625

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '69ea497e7db9'
down_revision = 'f9abaf338ea0'
branch_labels = None
depends_on = None


def upgrade():
    # Rename the table from account_roles to account_user_roles
    op.rename_table('account_roles', 'account_user_roles')


def downgrade():
    # Rename the table from account_user_roles back to account_roles
    op.rename_table('account_user_roles', 'account_roles')
