"""Package type phase range (start/end phase and label)

Replaces package_types.phase_id with start_phase_id, end_phase_id and phase_label so a
package type can be submitted across a range of track phases (for example Pre-EA and
Early Engagement). Existing rows are backfilled with start = end = the old phase_id.

Revision ID: d5a1c7e9b3f2
Revises: c8d7e6f5a4b3
Create Date: 2026-11-18 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5a1c7e9b3f2'
down_revision = 'c8d7e6f5a4b3'
branch_labels = None
depends_on = None


def upgrade():
    """Add start/end phase columns and phase_label, backfill, drop phase_id."""
    op.add_column('package_types', sa.Column(
        'start_phase_id', sa.Integer(), nullable=True,
        comment='First track phase in which this package type can be submitted'))
    op.add_column('package_types', sa.Column(
        'end_phase_id', sa.Integer(), nullable=True,
        comment='Last track phase in which this package type can be submitted'))
    op.add_column('package_types', sa.Column(
        'phase_label', sa.String(length=255), nullable=True,
        comment='Text shown to the proponent for the phase range, e.g. Pre-EA/Early Engagement'))
    op.create_foreign_key(
        'fk_package_types_start_phase_id', 'package_types', 'track_phases', ['start_phase_id'], ['id'])
    op.create_foreign_key(
        'fk_package_types_end_phase_id', 'package_types', 'track_phases', ['end_phase_id'], ['id'])
    op.create_index('idx_package_types_start_phase_id', 'package_types', ['start_phase_id'])
    op.create_index('idx_package_types_end_phase_id', 'package_types', ['end_phase_id'])

    op.execute('UPDATE package_types SET start_phase_id = phase_id, end_phase_id = phase_id')

    # IF EXISTS keeps this safe on environments where these objects were already renamed or removed.
    op.execute('ALTER TABLE package_types DROP CONSTRAINT IF EXISTS uq_package_type_name_phase')
    op.execute('DROP INDEX IF EXISTS idx_package_types_phase_id')
    op.execute('ALTER TABLE package_types DROP CONSTRAINT IF EXISTS fk_package_types_phase_id')
    op.drop_column('package_types', 'phase_id')

    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.create_unique_constraint(
            'uq_package_type_name_phase_range', ['name', 'start_phase_id', 'end_phase_id'])


def downgrade():
    """Restore phase_id from start_phase_id and drop the range columns."""
    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.drop_constraint('uq_package_type_name_phase_range', type_='unique')

    op.add_column('package_types', sa.Column('phase_id', sa.Integer(), nullable=True))
    op.execute('UPDATE package_types SET phase_id = start_phase_id')
    op.create_foreign_key('fk_package_types_phase_id', 'package_types', 'track_phases', ['phase_id'], ['id'])
    op.create_index('idx_package_types_phase_id', 'package_types', ['phase_id'])

    op.drop_index('idx_package_types_end_phase_id', table_name='package_types')
    op.drop_index('idx_package_types_start_phase_id', table_name='package_types')
    op.drop_constraint('fk_package_types_end_phase_id', 'package_types', type_='foreignkey')
    op.drop_constraint('fk_package_types_start_phase_id', 'package_types', type_='foreignkey')
    op.drop_column('package_types', 'phase_label')
    op.drop_column('package_types', 'end_phase_id')
    op.drop_column('package_types', 'start_phase_id')

    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_package_type_name_phase', ['name', 'phase_id'])
