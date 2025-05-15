""" join submission history of different versions of packages

Revision ID: 5ca405e40d35
Revises: 826fa830606a
Create Date: 2025-05-13 10:37:03.793361

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5ca405e40d35'
down_revision = 'b92c15f6a7b5'
branch_labels = None
depends_on = None


def upgrade():
    # Get the database connection
    bind = op.get_bind()
    metadata = sa.MetaData()
    metadata.reflect(bind=bind)

    # Retrieve the tables
    activity_logs = sa.Table('activity_logs', metadata, autoload_with=bind)
    packages = sa.Table('packages', metadata, autoload_with=bind)
    package_versions = sa.Table('package_versions', metadata, autoload_with=bind)

    # Perform the update using correct SQLAlchemy expressions
    stmt = (
        activity_logs.update()
        .where(sa.and_(
            activity_logs.c.entity_id == packages.c.id,
            activity_logs.c.entity_type == sa.literal('PACKAGE'),
            packages.c.version_id == package_versions.c.id
        ))
        .values(entity_id=package_versions.c.original_package_id)
    )

    bind.execute(stmt)


def downgrade():
    pass

