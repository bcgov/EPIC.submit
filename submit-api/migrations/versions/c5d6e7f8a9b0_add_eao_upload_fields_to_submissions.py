"""Add EAO-upload fields to submissions.

Revision ID: c5d6e7f8a9b0
Revises: b4c89a73d012
"""
from alembic import op
import sqlalchemy as sa


revision = 'c5d6e7f8a9b0'
down_revision = 'b4c89a73d012'
branch_labels = None
depends_on = None


def upgrade():
    """Add the EAO-uploaded flag and the date the EAO received the document."""
    op.add_column(
        'submissions',
        sa.Column(
            'is_eao_uploaded',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
            comment='Whether EAO staff uploaded the document on behalf of the Regulated Party',
        ),
    )
    op.add_column(
        'submissions',
        sa.Column(
            'received_date',
            sa.Date(),
            nullable=True,
            comment='Date the EAO received an EAO-uploaded document; shown as Date Submitted',
        ),
    )


def downgrade():
    """Remove the EAO-upload fields."""
    op.drop_column('submissions', 'received_date')
    op.drop_column('submissions', 'is_eao_uploaded')
