""" Update user_roles package_ids to original_package_ids

Revision ID: 7cadbb980cf7
Revises: c5f4cd047da4
Create Date: 2025-07-14 09:03:38.061983

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session, declarative_base

# revision identifiers, used by Alembic.
revision = '7cadbb980cf7'
down_revision = 'c5f4cd047da4'
branch_labels = None
depends_on = None

Base = declarative_base()


def upgrade():
    # Add new column — keeping old one intact
    op.add_column('user_roles', sa.Column('original_package_ids', sa.ARRAY(sa.Integer), nullable=True))
    op.add_column('invitations', sa.Column('original_package_ids', sa.ARRAY(sa.Integer), nullable=True))
    bind = op.get_bind()

    # Use raw table references to avoid importing live ORM models
    # (which may have columns not yet present at this migration step)
    packages_table = sa.table(
        'packages',
        sa.column('id', sa.Integer),
        sa.column('version_id', sa.Integer),
    )
    package_versions_table = sa.table(
        'package_versions',
        sa.column('id', sa.Integer),
        sa.column('original_package_id', sa.Integer),
    )
    user_roles_table = sa.table(
        'user_roles',
        sa.column('id', sa.Integer),
        sa.column('package_ids', sa.ARRAY(sa.Integer)),
        sa.column('original_package_ids', sa.ARRAY(sa.Integer)),
    )

    # Build mapping: package.id → version_id → original_package_id
    packages = bind.execute(
        sa.select(packages_table.c.id, packages_table.c.version_id)
    ).fetchall()
    versions = bind.execute(
        sa.select(package_versions_table.c.id, package_versions_table.c.original_package_id)
    ).fetchall()

    package_to_version = {p.id: p.version_id for p in packages}
    version_to_original = {v.id: v.original_package_id for v in versions}

    package_to_original = {
        pid: version_to_original.get(vid)
        for pid, vid in package_to_version.items()
        if version_to_original.get(vid) is not None
    }

    # Assign new original_package_ids for each user role
    roles = bind.execute(
        sa.select(user_roles_table.c.id, user_roles_table.c.package_ids)
        .where(user_roles_table.c.package_ids.isnot(None))
    ).fetchall()
    for role in roles:
        mapped_ids = [
            package_to_original.get(pid)
            for pid in role.package_ids or []
            if package_to_original.get(pid) is not None
        ]
        bind.execute(
            user_roles_table.update()
            .where(user_roles_table.c.id == role.id)
            .values(original_package_ids=mapped_ids)
        )

    # Update invitations using raw SQL to avoid ORM model dependency issues
    invitations_table = sa.table(
        'invitations',
        sa.column('id', sa.Integer),
        sa.column('package_ids', sa.ARRAY(sa.Integer)),
        sa.column('original_package_ids', sa.ARRAY(sa.Integer))
    )
    invitations = bind.execute(
        sa.select(invitations_table.c.id, invitations_table.c.package_ids)
        .where(invitations_table.c.package_ids.isnot(None))
    ).fetchall()

    for invitation in invitations:
        mapped_ids = [
            package_to_original.get(pid)
            for pid in invitation.package_ids or []
            if package_to_original.get(pid) is not None
        ]
        bind.execute(
            invitations_table.update()
            .where(invitations_table.c.id == invitation.id)
            .values(original_package_ids=mapped_ids)
        )


def downgrade():
    # Remove the new column — original package IDs
    op.drop_column('user_roles', 'original_package_ids')
    op.drop_column('invitations', 'original_package_ids')
