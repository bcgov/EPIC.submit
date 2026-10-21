"""Rekey project_reports on the condition submission id

Revision ID: b1c2d3e4f5a7
Revises: f0a1b2c3d4e5
Create Date: 2026-10-20 00:40:00.000000

The condition repository now returns a stable ``id`` on each report submission
(the report phase row). ``project_reports.report_id`` now holds that submission
id, which uniquely identifies an obligation. The old composite unique constraint
``(project_id, report_id, phase, timing, frequency)`` is replaced with
``(project_id, report_id)``.

PREREQUISITE: this migration only changes the unique constraint; it does not
delete any data. Rows synced under the old meaning (where ``report_id`` held the
report object id) can have duplicate ``(project_id, report_id)`` pairs and must be
cleared manually (along with their Report packages) BEFORE running this migration,
otherwise creating the new unique constraint will fail. The next sync repopulates
``project_reports`` correctly using submission ids.
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5a7'
down_revision = 'f0a1b2c3d4e5'
branch_labels = None
depends_on = None

OLD_CONSTRAINT = 'uq_project_report_phase'
NEW_CONSTRAINT = 'uq_project_report_submission'


def upgrade():
    """Rekey the unique constraint on (project_id, report_id).

    Does not delete any data. Existing duplicate rows must be cleared manually
    before running this migration (see the module docstring).
    """
    with op.batch_alter_table('project_reports', schema=None) as batch_op:
        batch_op.drop_constraint(OLD_CONSTRAINT, type_='unique')
        batch_op.create_unique_constraint(
            NEW_CONSTRAINT, ['project_id', 'report_id']
        )


def downgrade():
    """Restore the old composite unique constraint."""
    with op.batch_alter_table('project_reports', schema=None) as batch_op:
        batch_op.drop_constraint(NEW_CONSTRAINT, type_='unique')
        batch_op.create_unique_constraint(
            OLD_CONSTRAINT,
            ['project_id', 'report_id', 'phase', 'timing', 'frequency'],
        )
