"""Add a document ordering value to submissions.

Revision ID: b4c89a73d012
Revises: a2b3c4d5e6f7
"""
from alembic import op
import sqlalchemy as sa


revision = 'b4c89a73d012'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    """Store document order and place existing supporting files after main files."""
    op.add_column(
        'submissions',
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
    )
    # Older uploads relied on separate folder names; preserve that display order.
    op.execute("""
        UPDATE submissions
        SET sort_order = 1
        WHERE submitted_document_id IN (
            SELECT id
            FROM submitted_documents
            WHERE folder IN (
                'supporting_documents',
                'supporting',
                'ipd_supporting_documents',
                'engagement_plan_supporting_documents',
                'report_supporting_documents'
            )
        )
    """)


def downgrade():
    """Remove the submission ordering value."""
    op.drop_column('submissions', 'sort_order')
