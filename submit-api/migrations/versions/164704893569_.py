""" Update folder values in submitted_documents table for IEM

Revision ID: 164704893569
Revises: e635c4f73779
Create Date: 2025-06-09 12:30:18.678839

"""
from alembic import op
from sqlalchemy.sql import table, column
from sqlalchemy import String


# revision identifiers, used by Alembic.
revision = '164704893569'
down_revision = 'e635c4f73779'
branch_labels = None
depends_on = None

IEM = 'iem'
SUPPORTING = 'supporting'
IEMS = 'iems'
SUPPORTING_DOCUMENTS = 'supporting_documents'

# Define the table and columns for the update
submitted_documents = table(
    'submitted_documents',
    column('folder', String)
)


def upgrade():
    # Update folder values
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == IEM)
        .values(folder=IEMS)
    )
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == SUPPORTING)
        .values(folder=SUPPORTING_DOCUMENTS)
    )


def downgrade():
    # Revert folder values to their original state
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == IEMS)
        .values(folder=IEM)
    )
    op.execute(
        submitted_documents.update()
        .where(submitted_documents.c.folder == SUPPORTING_DOCUMENTS)
        .values(folder=SUPPORTING)
    )
