"""

Revision ID: 5c2f7a40e201
Revises: 1e9b19ace1fa
Create Date: 2024-12-24 10:54:04.654294

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5c2f7a40e201"
down_revision = "1e9b19ace1fa"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type typ 
                       JOIN pg_enum en ON en.enumtypid = typ.oid 
                       WHERE typ.typname = 'packagestatus' AND en.enumlabel = 'UNDER_REVIEW') THEN
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
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'itemstatus') 
        AND enumlabel = 'UNDER_REVIEW'
    ) THEN
        ALTER TYPE itemstatus ADD VALUE 'UNDER_REVIEW';
    END IF;
    END$$;
    """
    )


def downgrade():
    # Downgrade logic for removing an enum value in PostgreSQL is complex and not directly supported.
    # One workaround involves creating a new enum type without the value, updating all dependencies, and dropping the old type.
    pass
