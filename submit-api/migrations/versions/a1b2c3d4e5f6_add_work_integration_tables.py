"""add_work_integration_tables

Revision ID: a1b2c3d4e5f6
Revises: fb95dbfcb9d9
Create Date: 2026-02-24 18:43:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'fb95dbfcb9d9'
branch_labels = None
depends_on = None


def upgrade():
    # Create track_phases table
    op.create_table('track_phases',
        sa.Column('id', sa.Integer(), nullable=False, comment='Phase ID from EPIC.track'),
        sa.Column('name', sa.String(255), nullable=False, comment='Phase name'),
        sa.Column('ea_act_id', sa.Integer(), nullable=True, comment='Environmental Assessment Act ID'),
        sa.Column('work_type_id', sa.Integer(), nullable=False, comment='Work type ID from EPIC.track'),
        sa.Column('work_type_name', sa.String(255), nullable=True, comment='Work type name for display'),
        sa.Column('sort_order', sa.Integer(), nullable=True, comment='Order of phase in workflow'),
        sa.Column('number_of_days', sa.Integer(), nullable=True, comment='Number of days allocated for this phase'),
        sa.Column('legislated', sa.Boolean(), nullable=False, server_default='false', comment='Whether this phase has legislated time requirements'),
        sa.Column('enable_submit', sa.Boolean(), nullable=False, server_default='false', comment='Enable this phase for the submit to accept submissions'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', comment='Whether this phase is currently active'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false', comment='Soft delete flag'),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('created_date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_track_phases_work_type_id', 'track_phases', ['work_type_id'])
    op.create_index('idx_track_phases_name', 'track_phases', ['name'])

    # Create track_works table
    op.create_table('track_works',
        sa.Column('id', sa.Integer(), nullable=False, comment='Work ID from EPIC.track'),
        sa.Column('project_id', sa.Integer(), nullable=False, comment='Associated project ID'),
        sa.Column('current_phase_id', sa.Integer(), nullable=True, comment='Current phase of the work'),
        sa.Column('work_state', sa.String(50), nullable=True, comment='Current state (e.g., IN_PROGRESS, COMPLETED)'),
        sa.Column('title', sa.String(500), nullable=True, comment='Work title'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', comment='Whether this work is currently active'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false', comment='Soft delete flag'),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('created_date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], name='fk_track_works_project_id'),
        sa.ForeignKeyConstraint(['current_phase_id'], ['track_phases.id'], name='fk_track_works_current_phase_id')
    )
    op.create_index('idx_track_works_project_id', 'track_works', ['project_id'])
    op.create_index('idx_track_works_work_state', 'track_works', ['work_state'])

    # Create account_project_works junction table
    op.create_table('account_project_works',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='Unique identifier for account project work association'),
        sa.Column('account_project_id', sa.Integer(), nullable=False, comment='Account project ID'),
        sa.Column('work_id', sa.Integer(), nullable=False, comment='Work ID from EPIC.track'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', comment='Whether this association is currently active'),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('created_date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['account_project_id'], ['account_projects.id'], name='fk_account_project_works_account_project_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['work_id'], ['track_works.id'], name='fk_account_project_works_work_id'),
        sa.UniqueConstraint('account_project_id', 'work_id', name='uq_account_project_work')
    )
    op.create_index('idx_account_project_works_account_project_id', 'account_project_works', ['account_project_id'])
    op.create_index('idx_account_project_works_work_id', 'account_project_works', ['work_id'])

    # Add phase_id to package_types table (nullable)
    op.add_column('package_types', sa.Column('phase_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_package_types_phase_id', 'package_types', 'track_phases', ['phase_id'], ['id'])
    op.create_index('idx_package_types_phase_id', 'package_types', ['phase_id'])

    # Add account_project_work_id to packages table (nullable)
    op.add_column('packages', sa.Column('account_project_work_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_packages_account_project_work_id', 'packages', 'account_project_works', ['account_project_work_id'], ['id'], ondelete='SET NULL')
    op.create_index('idx_packages_account_project_work_id', 'packages', ['account_project_work_id'])


def downgrade():
    # Remove foreign keys and columns from packages
    op.drop_index('idx_packages_account_project_work_id', table_name='packages')
    op.drop_constraint('fk_packages_account_project_work_id', 'packages', type_='foreignkey')
    op.drop_column('packages', 'account_project_work_id')

    # Remove foreign keys and columns from package_types
    op.drop_index('idx_package_types_phase_id', table_name='package_types')
    op.drop_constraint('fk_package_types_phase_id', 'package_types', type_='foreignkey')
    op.drop_column('package_types', 'phase_id')

    # Drop account_project_works table
    op.drop_index('idx_account_project_works_work_id', table_name='account_project_works')
    op.drop_index('idx_account_project_works_account_project_id', table_name='account_project_works')
    op.drop_table('account_project_works')

    # Drop track_works table
    op.drop_index('idx_track_works_work_state', table_name='track_works')
    op.drop_index('idx_track_works_work_type_id', table_name='track_works')
    op.drop_index('idx_track_works_project_id', table_name='track_works')
    op.drop_table('track_works')

    # Drop track_phases table
    op.drop_index('idx_track_phases_name', table_name='track_phases')
    op.drop_index('idx_track_phases_work_type_id', table_name='track_phases')
    op.drop_table('track_phases')
