"""Add new status

Revision ID: fb95dbfcb9d9
Revises: 3088bdcf44cc
Create Date: 2025-06-13 12:03:22.804876

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fb95dbfcb9d9'
down_revision = '3088bdcf44cc'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        DO $$
        DECLARE
            itemstatus_values text[];
            packagestatus_values text[];
            items_count integer;
            packages_count integer;
        BEGIN
            -- Check if tables have data
            SELECT COUNT(*) INTO items_count FROM items;
            SELECT COUNT(*) INTO packages_count FROM packages;
            
            -- Get existing values
            SELECT array_agg(quote_literal(enumlabel)) INTO itemstatus_values FROM pg_enum WHERE enumtypid = 'itemstatus'::regtype;
            SELECT array_agg(quote_literal(enumlabel)) INTO packagestatus_values FROM pg_enum WHERE enumtypid = 'packagestatus'::regtype;
            
            -- Create new types with all values plus 'NEW'
            EXECUTE 'CREATE TYPE itemstatus_new AS ENUM (' || array_to_string(itemstatus_values || ARRAY[quote_literal('NEW')], ',') || ')';
            EXECUTE 'CREATE TYPE packagestatus_new AS ENUM (' || array_to_string(packagestatus_values || ARRAY[quote_literal('NEW')], ',') || ')';
            
            -- Update columns
            ALTER TABLE items ALTER COLUMN status TYPE itemstatus_new USING status::text::itemstatus_new;
            ALTER TABLE packages ALTER COLUMN status TYPE packagestatus_new[] USING status::text[]::packagestatus_new[];
            
            -- Update data only if tables have rows
            IF items_count > 0 THEN
                UPDATE items SET status = 'NEW' WHERE status = 'NEW_SUBMISSION';
            END IF;
            
            IF packages_count > 0 THEN
                UPDATE packages SET status = array_replace(status, 'NEW_SUBMISSION', 'NEW');
            END IF;
            
            -- Drop old types and rename new ones
            DROP TYPE itemstatus;
            DROP TYPE packagestatus;
            ALTER TYPE itemstatus_new RENAME TO itemstatus;
            ALTER TYPE packagestatus_new RENAME TO packagestatus;
        END $$;
    """)


def downgrade():
    op.execute("""
        DO $$
        DECLARE
            itemstatus_values text[];
            packagestatus_values text[];
        BEGIN
            -- Get existing values except 'NEW'
            SELECT array_agg(quote_literal(enumlabel)) INTO itemstatus_values FROM pg_enum WHERE enumtypid = 'itemstatus'::regtype AND enumlabel != 'NEW';
            SELECT array_agg(quote_literal(enumlabel)) INTO packagestatus_values FROM pg_enum WHERE enumtypid = 'packagestatus'::regtype AND enumlabel != 'NEW';
            
            -- Create old types
            EXECUTE 'CREATE TYPE itemstatus_old AS ENUM (' || array_to_string(itemstatus_values, ',') || ')';
            EXECUTE 'CREATE TYPE packagestatus_old AS ENUM (' || array_to_string(packagestatus_values, ',') || ')';
            
            -- Update data
            UPDATE items SET status = 'NEW_SUBMISSION' WHERE status = 'NEW';
            UPDATE packages SET status = array_replace(status, 'NEW', 'NEW_SUBMISSION');
            
            -- Update columns
            ALTER TABLE items ALTER COLUMN status TYPE itemstatus_old USING status::text::itemstatus_old;
            ALTER TABLE packages ALTER COLUMN status TYPE packagestatus_old[] USING status::text[]::packagestatus_old[];
            
            -- Drop new types and rename old ones
            DROP TYPE itemstatus;
            DROP TYPE packagestatus;
            ALTER TYPE itemstatus_old RENAME TO itemstatus;
            ALTER TYPE packagestatus_old RENAME TO packagestatus;
        END $$;
    """)