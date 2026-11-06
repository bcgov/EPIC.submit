"""Add a main-document marker to submissions.

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
    """Store main/supporting document role and mark existing primary files."""
    op.add_column(
        'submissions',
        sa.Column('is_main_document', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute("""
        UPDATE submissions
        SET is_main_document = TRUE
        WHERE submitted_document_id IN (
            SELECT id
            FROM submitted_documents
            WHERE folder IN (
                'ipds',
                'engagement_plans',
                'geospatial',
                'management_plans',
                'iems',
                'reports',
                'consultation_records',
                'upload_documents'
            )
        )
    """)


def downgrade():
    """Remove the main-document marker."""
    op.drop_column('submissions', 'is_main_document')
