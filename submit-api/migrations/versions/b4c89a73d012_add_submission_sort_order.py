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
    """Store document order and identify known main files already on record."""
    op.add_column(
        'submissions',
        sa.Column('sort_order', sa.Integer(), nullable=True),
    )
    # Older uploads used folders for this distinction; unknown folders stay supporting.
    op.execute("""
        UPDATE submissions AS submission
        SET sort_order = CASE
            WHEN document.folder IN (
                'ipds',
                'engagement_plans',
                'geospatial',
                'management_plans',
                'iems',
                'reports',
                'consultation_records',
                'upload_documents'
            ) THEN 0
            ELSE 1
        END
        FROM submitted_documents AS document
        WHERE submission.submitted_document_id = document.id
    """)
    op.execute("UPDATE submissions SET sort_order = 0 WHERE submitted_document_id IS NULL")
    op.alter_column(
        'submissions',
        'sort_order',
        existing_type=sa.Integer(),
        nullable=False,
        server_default='1',
    )


def downgrade():
    """Remove the submission ordering value."""
    op.drop_column('submissions', 'sort_order')
