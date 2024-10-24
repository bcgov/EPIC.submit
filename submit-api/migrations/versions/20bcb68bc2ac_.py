"""Create staff_users table

Revision ID: 20bcb68bc2ac
Revises: 
Create Date: 2024-06-27 14:22:33.838724

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = '20bcb68bc2ac'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('staff_users',
    sa.Column('created_date', sa.DateTime(), nullable=False),
    sa.Column('updated_date', sa.DateTime(), nullable=True),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('first_name', sa.String(length=50), nullable=True),
    sa.Column('middle_name', sa.String(length=50), nullable=True),
    sa.Column('last_name', sa.String(length=50), nullable=True),
    sa.Column('username', sa.String(length=100), nullable=True),
    sa.Column('email_address', sa.String(length=100), nullable=True),
    sa.Column('contact_number', sa.String(length=50), nullable=True),
    sa.Column('created_by', sa.String(length=50), nullable=True),
    sa.Column('updated_by', sa.String(length=50), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_staff_users_username'), 'staff_users', ['username'], unique=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_staff_users_username'), table_name='staff_users')
    op.drop_table('staff_users')
    # ### end Alembic commands ###
