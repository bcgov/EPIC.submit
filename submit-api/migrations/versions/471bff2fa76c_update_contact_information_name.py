"""Update item type name from Contact Information Form to Submission Contact Information

Revision ID: 471bff2fa76c
Revises: f3e5506ce9df
Create Date: 2025-01-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '471bff2fa76c'
down_revision = 'f3e5506ce9df'
branch_labels = None
depends_on = None

# Define constants for the item type names
OLD_NAME = 'Contact Information Form'
NEW_NAME = 'Submission Contact Information'
ITEM_TYPE_ID = 1


def upgrade():
    # Update the item type name for id=1
    op.execute(
        f"UPDATE item_types SET name = '{NEW_NAME}' WHERE id = {ITEM_TYPE_ID} AND name = '{OLD_NAME}'"
    )


def downgrade():
    # Revert the item type name back to the original value
    op.execute(
        f"UPDATE item_types SET name = '{OLD_NAME}' WHERE id = {ITEM_TYPE_ID} AND name = '{NEW_NAME}'"
    )
