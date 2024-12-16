""" Add initial package versions

Revision ID: 550e2205818f
Revises: be096790789f
Create Date: 2024-12-11 15:14:04.255245

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.sql import column, table


# revision identifiers, used by Alembic.
revision = '550e2205818f'
down_revision = 'be096790789f'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Populate the package_versions table with existing packages that don't already have version records
    bind = op.get_bind()
    session = Session(bind=bind)

    # Define the package_versions table for inserting data
    package_versions_table = table(
        'package_versions',
        column('id', sa.Integer),
        column('package_id', sa.Integer),
        column('original_package_id', sa.Integer),
        column('version', sa.Integer)
    )

    # Fetch all existing packages
    existing_packages = session.execute(text('SELECT id FROM packages')).fetchall()

    # Fetch existing versions to get a list of package_ids that already have versions
    existing_versions = session.execute(text('SELECT package_id FROM package_versions')).fetchall()
    existing_package_ids_versions = {version.package_id for version in existing_versions}

    # Insert a new version record for each package that doesn't already have one
    for package_id in [package.id for package in existing_packages if package.id not in existing_package_ids_versions]:
        session.execute(package_versions_table.insert().values(package_id=package_id, original_package_id=package_id, version=1))


def downgrade():
    # Note: Only drop the table if we are rolling back the entire migration that initially added it.
    op.drop_table('package_versions')


