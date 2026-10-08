"""Add virus scan result to submitted documents.

Revision ID: a4c8e2f6b0d1
Revises: f2a7c1d9e4b3
"""

from alembic import op
import sqlalchemy as sa


revision = 'a4c8e2f6b0d1'
down_revision = 'f2a7c1d9e4b3'
branch_labels = None
depends_on = None


def upgrade():
    """Add scan result and grandfather existing documents as clean."""
    op.add_column(
        'submitted_documents',
        sa.Column('virus_scan_result', sa.String(length=20), nullable=True),
    )
    op.execute("UPDATE submitted_documents SET virus_scan_result = 'CLEAN'")
    op.create_index(
        'ix_submitted_documents_pending_virus_scan',
        'submitted_documents',
        ['created_date'],
        postgresql_where=sa.text('virus_scan_result IS NULL'),
    )
    op.create_index(
        'ix_submitted_documents_failed_virus_scan',
        'submitted_documents',
        ['updated_date'],
        postgresql_where=sa.text("virus_scan_result = 'FAILED'"),
    )


def downgrade():
    """Remove scan result."""
    op.drop_index(
        'ix_submitted_documents_failed_virus_scan',
        table_name='submitted_documents',
    )
    op.drop_index(
        'ix_submitted_documents_pending_virus_scan',
        table_name='submitted_documents',
    )
    op.drop_column('submitted_documents', 'virus_scan_result')
