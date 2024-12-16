""" Rename roles table to account_roles

Revision ID: 6b4eb077a447
Revises: 69ea497e7db9
Create Date: 2024-12-16 15:00:53.829228

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '6b4eb077a447'
down_revision = '69ea497e7db9'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the project_teams table
    op.drop_table('project_teams')

    # Rename the roles table to account_roles
    op.rename_table('roles', 'account_roles')

    # Update the foreign key constraint in account_user_roles
    with op.batch_alter_table('account_user_roles', schema=None) as batch_op:
        batch_op.drop_constraint('account_roles_role_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key('account_roles_role_id_fkey', 'account_roles', ['role_id'], ['id'])


def downgrade():
    # Rename the account_roles table back to roles
    op.rename_table('account_roles', 'roles')

    # Update the foreign key constraint in account_user_roles
    with op.batch_alter_table('account_user_roles', schema=None) as batch_op:
        batch_op.drop_constraint('account_roles_role_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key('account_roles_role_id_fkey', 'roles', ['role_id'], ['id'])
