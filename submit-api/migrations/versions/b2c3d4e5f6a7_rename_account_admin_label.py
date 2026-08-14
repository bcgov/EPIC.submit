"""rename account admin label to regulated party account administrator

Revision ID: b2c3d4e5f6a7
Revises: 9b50b1ec9f42
Create Date: 2026-08-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = '9b50b1ec9f42'
branch_labels = None
depends_on = None


def upgrade():
    """Rename the ACCOUNT_PRIMARY_ADMIN role label."""
    op.execute(
        sa.text(
            "UPDATE roles SET label = 'Regulated Party Account Administrator' "
            "WHERE role_name = 'ACCOUNT_PRIMARY_ADMIN'"
        )
    )


def downgrade():
    """Revert the ACCOUNT_PRIMARY_ADMIN role label."""
    op.execute(
        sa.text(
            "UPDATE roles SET label = 'Account Administrator' "
            "WHERE role_name = 'ACCOUNT_PRIMARY_ADMIN'"
        )
    )
