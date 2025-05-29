""" Update folder values in submitted_documents table

Revision ID: e635c4f73779
Revises: 4f8c0a55cb6a
Create Date: 2025-05-29 12:57:15.038180

"""
from alembic import op
from sqlalchemy.sql import table, column
from sqlalchemy import String


# revision identifiers, used by Alembic.
revision = 'e635c4f73779'
down_revision = '4f8c0a55cb6a'
branch_labels = None
depends_on = None

# Define the table and columns for the update
submitted_documents = table(
    'submitted_documents',
    column('folder', String)
)

# Define constants for folder values
FOLDER_MANAGEMENT_PLAN = 'management_plan'
FOLDER_MANAGEMENT_PLANS = 'management_plans'
FOLDER_SUPPORTING = 'supporting'
FOLDER_SUPPORTING_DOCUMENTS = 'supporting_documents'


def upgrade():
    # Update folder values
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == FOLDER_MANAGEMENT_PLAN)
        .values(folder=FOLDER_MANAGEMENT_PLANS)
    )
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == FOLDER_SUPPORTING)
        .values(folder=FOLDER_SUPPORTING_DOCUMENTS)
    )


def downgrade():
    # Revert folder values to their original state
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == FOLDER_MANAGEMENT_PLANS)
        .values(folder=FOLDER_MANAGEMENT_PLAN)
    )
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == FOLDER_SUPPORTING_DOCUMENTS)
        .values(folder=FOLDER_SUPPORTING)
    )
