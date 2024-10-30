"""Add user_id to account_users

Revision ID: cba5ebbb4a74
Revises: 20a2b81fe5f7
Create Date: 2024-10-30 12:58:53.607737

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'cba5ebbb4a74'
down_revision = '20a2b81fe5f7'
branch_labels = None
depends_on = None


def upgrade():
    # add user_id to account_users and populate it then make it foreign key
    op.add_column('account_users', sa.Column('user_id', sa.Integer(), nullable=True))
    op.execute("UPDATE account_users au SET user_id = u.id FROM users u WHERE u.auth_guid = au.auth_guid")
    op.alter_column('account_users', 'user_id', existing_type=sa.Integer(), nullable=False)
    op.create_foreign_key('fk_account_users_user_id_users', 'account_users', 'users', ['user_id'], ['id'])


def downgrade():
    # remove user_id from account_users
    op.drop_constraint('fk_account_users_user_id_users', 'account_users', type_='foreignkey')
    op.drop_column('account_users', 'user_id')
