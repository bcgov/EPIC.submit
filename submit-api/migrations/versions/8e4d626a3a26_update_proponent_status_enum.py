"""Update proponent_status enum

Revision ID: 8e4d626a3a26
Revises: d3e4f5a6b7c8
Create Date: 2026-01-19 10:54:21.582041

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8e4d626a3a26'
down_revision = 'd3e4f5a6b7c8'
branch_labels = None
depends_on = None

old_options = ('ELIGIBLE', 'INELIGIBLE', 'PENDING_ONBOARDING', 'ONBOARDED')
new_otions = sorted(old_options + ('INVITE_GENERATED',))

old_type = sa.Enum(*old_options, name='proponentstatus')
new_type = sa.Enum(*new_otions, name='proponentstatus')

def upgrade():
    op.execute('ALTER TYPE proponentstatus RENAME TO tmp_proponentstatus')
    new_type.create(op.get_bind())
    op.execute('ALTER TABLE proponents ALTER COLUMN status TYPE proponentstatus USING status::text::proponentstatus')
    op.execute('DROP TYPE tmp_proponentstatus')


def downgrade():
    op.execute("UPDATE proponents SET status = 'PENDING_ONBOARDING' WHERE status = 'INVITE_GENERATED'")
    op.execute('ALTER TYPE proponentstatus RENAME TO tmp_proponentstatus')
    old_type.create(op.get_bind())
    op.execute('ALTER TABLE proponents ALTER COLUMN status TYPE proponentstatus USING status::text::proponentstatus')
    op.execute('DROP TYPE tmp_proponentstatus')
