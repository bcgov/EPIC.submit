"""Classify existing shared package timeline events as public.

Revision ID: c9e4a17b203d
Revises: b7f1a2c3d4e5

The existing workflow writers omitted visibility and inherited STAFF. Restrict
this correction to the known shared milestone actions; other entries stay private.
"""
from alembic import op
import sqlalchemy as sa

revision = 'c9e4a17b203d'
down_revision = 'b7f1a2c3d4e5'
branch_labels = None
depends_on = None

SHARED_ACTIONS = (
    'Submitted to EAO',
    'Updated Submission',
    'Start Consultation Check',
    'Update Requested',
    'Passed Consultation Check',
    'Failed Consultation Check',
    'Start MP Review',
    'MP Approved',
    'MP Accepted',
    'MP Satisfied',
    'MP Reviewed',
    'MP Review Rejected',
    'MP Review Failed',
    'EAO requested a new version',
    'Revision Required',
    'Revision Requested',
    'Start IEM Review',
    'IEM Approved',
    'IEM Accepted',
    'IEM Satisfied',
    'IEM Review Rejected',
    'IEM Review Failed',
    'IEM Reviewed',
    'Resubmission Invitation',
)


def upgrade():
    """Preserve the existing proponent timeline when visibility is enforced."""
    activity_logs = sa.table(
        'activity_logs',
        sa.column('entity_type', sa.String),
        sa.column('action', sa.String),
        sa.column('visibility', sa.String),
    )
    op.execute(
        activity_logs.update()
        .where(activity_logs.c.entity_type == 'PACKAGE')
        .where(activity_logs.c.action.in_(SHARED_ACTIONS))
        .where(activity_logs.c.visibility.in_(('STAFF', 'staff')))
        .values(visibility='PUBLIC')
    )


def downgrade():
    """Keep classifications: original PUBLIC entries cannot be distinguished safely."""
    # Data correction only. Reverting all matching PUBLIC rows would also change
    # entries that were intentionally public before this migration.
    pass
