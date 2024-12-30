"""
Revision ID: 5c2f7a40e201
Revises: 910c8029a678
Create Date: 2024-12-24 10:54:04.654294
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "5c2f7a40e201"
down_revision = "910c8029a678"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_type typ 
            JOIN pg_enum en ON en.enumtypid = typ.oid 
            WHERE typ.typname = 'packagestatus' AND en.enumlabel IN ('UNDER_REVIEW', 'UNDER_CONSULTATION_CHECK')
        ) THEN
            ALTER TYPE packagestatus ADD VALUE 'UNDER_REVIEW';
            ALTER TYPE packagestatus ADD VALUE 'UNDER_CONSULTATION_CHECK';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'itemstatus')
            AND enumlabel IN ('UNDER_REVIEW', 'UNDER_CONSULTATION_CHECK')
        ) THEN
            ALTER TYPE itemstatus ADD VALUE 'UNDER_REVIEW';
            ALTER TYPE itemstatus ADD VALUE 'UNDER_CONSULTATION_CHECK';
        END IF;
    END$$;
    """
    )


def downgrade():
    pass
