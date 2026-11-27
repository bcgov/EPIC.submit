"""Add non_work_package_map and link package types to them

Replaces the hard-coded "Management Plan & Related Documents / Post Decision"
labels with database-driven non-work package maps, and links phase-less package types
to the non-work package map entry they belong to.

Revision ID: b8d2f4a6c1e3
Revises: a7c3e9f1b2d4
Create Date: 2026-11-24 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8d2f4a6c1e3'
down_revision = 'a7c3e9f1b2d4'
branch_labels = None
depends_on = None

NON_WORK_PACKAGE_MAPS = [
    {
        'code': 'MANAGEMENT_PLAN',
        'work_label': 'Management Plan & Related Documents',
        'phase_label': 'Post Decision',
        'eligibility': 'APPROVED_CONDITION',
        'is_onboarding_option': True,
        'sort_order': 1,
    },
    {
        # Same eligibility as the project page's Reports & Recurring Submissions section.
        # Not an onboarding option: report packages are synced for onboarded projects.
        'code': 'REPORT',
        'work_label': 'Reports & Recurring Submissions',
        'phase_label': 'Post Decision',
        'eligibility': 'APPROVED_CONDITION',
        'is_onboarding_option': False,
        'sort_order': 2,
    },
]

# Phase-less package type name -> non-work package map code
PACKAGE_TYPE_MAPPING = {
    'Management Plan': 'MANAGEMENT_PLAN',
    'IEM': 'MANAGEMENT_PLAN',
    'Report': 'REPORT',
}


def upgrade():
    """Create and seed non_work_package_map, then link phase-less package types."""
    non_work_package_map = op.create_table(
        'non_work_package_map',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False,
                  comment='Matches the NonWorkItemType enum value, e.g. MANAGEMENT_PLAN'),
        sa.Column('work_label', sa.String(length=255), nullable=False,
                  comment='Text shown in the Work column/filter, e.g. Management Plan & Related Documents'),
        sa.Column('phase_label', sa.String(length=255), nullable=False,
                  comment='Text shown in the Phase column/filter, e.g. Post Decision'),
        sa.Column('eligibility', sa.String(length=50), nullable=False,
                  comment='NonWorkItemEligibility value deciding which projects this package map applies to'),
        sa.Column('is_onboarding_option', sa.Boolean(), nullable=False, server_default=sa.false(),
                  comment='Whether this package map is offered as a selectable entry when onboarding a proponent'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_date', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=50), nullable=True),
        sa.Column('updated_by', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code', name='uq_non_work_package_map_code'),
    )
    op.bulk_insert(non_work_package_map, NON_WORK_PACKAGE_MAPS)

    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'non_work_package_map_id', sa.Integer(), nullable=True,
            comment='Non-work package map entry (e.g. Management Plan, Report) packages of this type belong to '
                    'when not tied to a work'))
        batch_op.create_foreign_key(
            'fk_package_types_non_work_package_map_id', 'non_work_package_map',
            ['non_work_package_map_id'], ['id'])

    conn = op.get_bind()
    for package_type_name, code in PACKAGE_TYPE_MAPPING.items():
        conn.execute(
            sa.text(
                "UPDATE package_types SET non_work_package_map_id = "
                "(SELECT id FROM non_work_package_map WHERE code = :code) "
                "WHERE name = :name AND start_phase_id IS NULL AND end_phase_id IS NULL"
            ),
            {"code": code, "name": package_type_name},
        )


def downgrade():
    """Unlink package types and drop non_work_package_map."""
    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.drop_constraint('fk_package_types_non_work_package_map_id', type_='foreignkey')
        batch_op.drop_column('non_work_package_map_id')
    op.drop_table('non_work_package_map')
