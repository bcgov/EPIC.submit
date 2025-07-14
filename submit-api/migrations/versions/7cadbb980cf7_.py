""" Update user_roles package_ids to original_package_ids

Revision ID: 7cadbb980cf7
Revises: c5f4cd047da4
Create Date: 2025-07-14 09:03:38.061983

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import declarative_base

from submit_api.models import Package, PackageVersion, UserRole, Invitations

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
    session = Session(bind=bind)

    # Build mapping: package.id → version_id → original_package_id
    packages = session.query(Package.id, Package.version_id).all()
    versions = session.query(PackageVersion.id, PackageVersion.original_package_id).all()

    package_to_version = {p.id: p.version_id for p in packages}
    version_to_original = {v.id: v.original_package_id for v in versions}

    package_to_original = {
        pid: version_to_original.get(vid)
        for pid, vid in package_to_version.items()
        if version_to_original.get(vid) is not None
    }

    # Assign new original_package_ids for each user role
    roles = session.query(UserRole).filter(UserRole.package_ids.isnot(None)).all()
    for role in roles:
        mapped_ids = [
            package_to_original.get(pid)
            for pid in role.package_ids or []
            if package_to_original.get(pid) is not None
        ]
        role.original_package_ids = mapped_ids

    invitations = session.query(Invitations).filter(Invitations.package_ids.isnot(None)).all()
    for invitation in invitations:
        mapped_ids = [
            package_to_original.get(pid)
            for pid in invitation.package_ids or []
            if package_to_original.get(pid) is not None
        ]
        invitation.original_package_ids = mapped_ids

    session.commit()


def downgrade():
    # Remove the new column — original package IDs
    op.drop_column('user_roles', 'original_package_ids')
