"""update the submission previous versions

Revision ID: 7fb13a243f5c
Revises: b2c3d4e5f6a7
Create Date: 2026-08-19 12:02:09.863221

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7fb13a243f5c'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    """Link root_submission_id for submissions on revision packages to their predecessors."""
    bind = op.get_bind()

    # Step 1: Find all packages that are version 2+ along with their previous version's package id
    # We join packages -> package_versions to get the current version info,
    # then find the package_versions row for (same original_package_id, version - 1),
    # then find the package that points to that previous version row.
    newer_packages = bind.execute(sa.text("""
        SELECT
            new_pkg.id AS new_pkg_id,
            prev_pkg.id AS prev_pkg_id
        FROM packages new_pkg
        JOIN package_versions new_pv ON new_pkg.version_id = new_pv.id
        JOIN package_versions prev_pv ON prev_pv.original_package_id = new_pv.original_package_id
                                      AND prev_pv.version = new_pv.version - 1
        JOIN packages prev_pkg ON prev_pkg.version_id = prev_pv.id
        WHERE new_pv.version > 1
    """)).fetchall()

    for row in newer_packages:
        new_pkg_id = row.new_pkg_id
        prev_pkg_id = row.prev_pkg_id

        # Step 2: Get items on the new package
        new_items = bind.execute(sa.text("""
            SELECT id, type_id FROM items WHERE package_id = :pkg_id
        """), {"pkg_id": new_pkg_id}).fetchall()

        for new_item in new_items:
            # Step 3: Find matching item on the previous package by type_id
            prev_item = bind.execute(sa.text("""
                SELECT id FROM items
                WHERE package_id = :pkg_id AND type_id = :type_id
            """), {"pkg_id": prev_pkg_id, "type_id": new_item.type_id}).fetchone()

            if not prev_item:
                continue

            # Step 4: Get DOCUMENT submissions on the new item that point to themselves
            # (root_submission_id = id means they were never linked)
            new_subs = bind.execute(sa.text("""
                SELECT s.id, sd.folder
                FROM submissions s
                JOIN submitted_documents sd ON s.submitted_document_id = sd.id
                WHERE s.item_id = :item_id
                  AND s.type = 'DOCUMENT'
                  AND s.deleted = false
                  AND s.root_submission_id = s.id
            """), {"item_id": new_item.id}).fetchall()

            if not new_subs:
                continue

            # Step 5: Get DOCUMENT submissions on the previous item (non-pending, non-deleted)
            prev_subs = bind.execute(sa.text("""
                SELECT s.id, s.root_submission_id, s.active, sd.folder
                FROM submissions s
                JOIN submitted_documents sd ON s.submitted_document_id = sd.id
                WHERE s.item_id = :item_id
                  AND s.type = 'DOCUMENT'
                  AND s.deleted = false
                  AND s.status != 'PENDING'
                ORDER BY s.major_version DESC, s.minor_version DESC
            """), {"item_id": prev_item.id}).fetchall()

            if not prev_subs:
                continue

            # Step 6: Match by folder and link
            for new_sub in new_subs:
                new_folder = new_sub.folder
                matching_prev = [ps for ps in prev_subs if ps.folder == new_folder]

                old_root = None

                if len(matching_prev) >= 1:
                    # Take the latest version (results already sorted by major/minor desc)
                    # All versions within the same package share the same root_submission_id
                    old_root = matching_prev[0].root_submission_id
                elif len(prev_subs) == 1:
                    # Single submission fallback (different folder)
                    old_root = prev_subs[0].root_submission_id

                if old_root:
                    # Update the new submission's root_submission_id
                    bind.execute(sa.text("""
                        UPDATE submissions
                        SET root_submission_id = :old_root
                        WHERE id = :sub_id
                    """), {"old_root": old_root, "sub_id": new_sub.id})

                    # Also update any submissions that were chained off this one
                    # (minor versions within the new package that have
                    #  root_submission_id = new_sub.id)
                    bind.execute(sa.text("""
                        UPDATE submissions
                        SET root_submission_id = :old_root
                        WHERE root_submission_id = :old_self_root
                          AND id != :sub_id
                    """), {"old_root": old_root, "old_self_root": new_sub.id, "sub_id": new_sub.id})

    # Re-activate any submissions that were incorrectly deactivated by a prior run
    # of this migration. We identify them as: active=false, deleted=false, type=DOCUMENT,
    # and their root_submission_id is shared with a submission on a different item
    # (i.e. they were deactivated cross-package, not within the same item via replace).
    bind.execute(sa.text("""
        UPDATE submissions s
        SET active = true
        WHERE s.active = false
          AND s.deleted = false
          AND s.type = 'DOCUMENT'
          AND s.status != 'PENDING'
          AND EXISTS (
              SELECT 1 FROM submissions s2
              WHERE s2.root_submission_id = s.root_submission_id
                AND s2.item_id != s.item_id
                AND s2.active = true
                AND s2.deleted = false
          )
          AND NOT EXISTS (
              SELECT 1 FROM submissions s3
              WHERE s3.root_submission_id = s.root_submission_id
                AND s3.item_id = s.item_id
                AND s3.id != s.id
                AND s3.active = true
                AND s3.deleted = false
                AND s3.major_version >= s.major_version
                AND s3.minor_version > s.minor_version
          )
    """))


def downgrade():
    """Downgrade is not feasible — root_submission_id linkages cannot be cleanly reversed."""
    pass
