""" Add new status to package and item

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
                SELECT 1 
                FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'packagestatus')
                AND enumlabel = 'UNDER_REVIEW'
            ) THEN
                ALTER TYPE packagestatus ADD VALUE 'UNDER_REVIEW';
            END IF;
        END$$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'packagestatus')
                AND enumlabel = 'UNDER_CONSULTATION_CHECK'
            ) THEN
                ALTER TYPE packagestatus ADD VALUE 'UNDER_CONSULTATION_CHECK';
            END IF;
        END$$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'itemstatus')
                AND enumlabel = 'UNDER_REVIEW'
            ) THEN
                ALTER TYPE itemstatus ADD VALUE 'UNDER_REVIEW';
            END IF;
        END$$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'itemstatus')
                AND enumlabel = 'UNDER_CONSULTATION_CHECK'
            ) THEN
                ALTER TYPE itemstatus ADD VALUE 'UNDER_CONSULTATION_CHECK';
            END IF;
        END$$;
        """
    )


def downgrade():
    pass
