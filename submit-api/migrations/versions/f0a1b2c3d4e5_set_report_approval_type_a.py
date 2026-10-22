"""Set approval_type to A for the Report package type

Revision ID: f0a1b2c3d4e5
Revises: e9f0a1b2c3d4
Create Date: 2026-10-20 00:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f0a1b2c3d4e5'
down_revision = 'e9f0a1b2c3d4'
branch_labels = None
depends_on = None

REPORT_TYPE_NAME = 'Report'
REPORT_APPROVAL_TYPE = 'A'


def upgrade():
    """Set approval_type='A' on the existing Report package type."""
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE package_types SET approval_type = :approval_type "
            "WHERE name = :name AND phase_id IS NULL"
        ),
        {"approval_type": REPORT_APPROVAL_TYPE, "name": REPORT_TYPE_NAME},
    )


def downgrade():
    """Clear approval_type on the Report package type."""
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE package_types SET approval_type = NULL "
            "WHERE name = :name AND phase_id IS NULL"
        ),
        {"name": REPORT_TYPE_NAME},
    )
