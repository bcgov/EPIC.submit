"""add banner_configurations table

Revision ID: b7f1a2c3d4e5
Revises: 5d55bcdaf8b5
Create Date: 2026-09-16 10:00:00.000000

Adds the banner_configurations table backing the dynamic, staff-managed
welcome-page banner. Replaces the previous env-var-gated banners.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b7f1a2c3d4e5'
down_revision = '5d55bcdaf8b5'
branch_labels = None
depends_on = None


BANNER_TYPE_ENUM = sa.Enum(
    'INFO', 'SUCCESS', 'WARNING', 'FAILURE', 'NONE',
    name='bannertype'
)


def upgrade():
    """Create the banner_configurations table."""
    op.create_table(
        'banner_configurations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('banner_type', BANNER_TYPE_ENUM, nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=50), nullable=True),
        sa.Column('updated_by', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_banner_configurations_is_active',
        'banner_configurations',
        ['is_active'],
        unique=False,
    )


def downgrade():
    """Drop the banner_configurations table and its enum type."""
    op.drop_index('ix_banner_configurations_is_active', table_name='banner_configurations')
    op.drop_table('banner_configurations')
    BANNER_TYPE_ENUM.drop(op.get_bind(), checkfirst=True)
