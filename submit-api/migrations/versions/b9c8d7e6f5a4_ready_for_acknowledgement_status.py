"""Replace VERIFIED + PENDING_ACKNOWLEDGEMENT with READY_FOR_ACKNOWLEDGEMENT

For package types with approval type B or C, a package whose documents are all
verified now carries the single READY_FOR_ACKNOWLEDGEMENT status instead of the
VERIFIED + PENDING_ACKNOWLEDGEMENT pair. This rewrites stored package statuses so
they match the new derivation. Type A packages keep VERIFIED. Other statuses on the
package (for example overlays) are preserved. The enum values already exist in the
packagestatus type (see 0a91b52dc3b1), so no DDL is needed.

Revision ID: b9c8d7e6f5a4
Revises: c5d6e7f8a9b0
Create Date: 2026-11-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b9c8d7e6f5a4'
down_revision = 'c5d6e7f8a9b0'
branch_labels = None
depends_on = None


def _packages_matching(conn, status_values, approval_types):
    """Return ids of type B/C packages whose status array overlaps ``status_values``.

    Comparing as text avoids touching enum values that may have been added earlier in
    the same migration transaction (PostgreSQL rejects using those until commit).
    """
    rows = conn.execute(
        sa.text(
            "SELECT p.id FROM packages p JOIN package_types pt ON p.type_id = pt.id "
            "WHERE pt.approval_type::text = ANY(:types) "
            "AND p.status::text[] && CAST(:values AS text[])"
        ),
        {"types": approval_types, "values": status_values},
    ).fetchall()
    return [row[0] for row in rows]


def _rewrite(conn, package_ids, remove, add):
    """Remove ``remove`` statuses from the given packages and append ``add``."""
    if not package_ids:
        return
    conn.execute(
        sa.text(
            "UPDATE packages SET status = CAST("
            "array_append(array_remove(array_remove(status::text[], :r1), :r2), :add) "
            "AS packagestatus[]) WHERE id = ANY(:ids)"
        ),
        {"r1": remove[0], "r2": remove[1], "add": add, "ids": package_ids},
    )


def upgrade():
    """Collapse VERIFIED/PENDING_ACKNOWLEDGEMENT into READY_FOR_ACKNOWLEDGEMENT for types B and C."""
    conn = op.get_bind()
    ids = _packages_matching(conn, ['VERIFIED', 'PENDING_ACKNOWLEDGEMENT'], ['B', 'C'])
    # Skip packages that already carry the new status.
    already = set(_packages_matching(conn, ['READY_FOR_ACKNOWLEDGEMENT'], ['B', 'C']))
    _rewrite(conn, [i for i in ids if i not in already],
             ('VERIFIED', 'PENDING_ACKNOWLEDGEMENT'), 'READY_FOR_ACKNOWLEDGEMENT')


def downgrade():
    """Restore the VERIFIED + PENDING_ACKNOWLEDGEMENT pair for types B and C."""
    conn = op.get_bind()
    ids = _packages_matching(conn, ['READY_FOR_ACKNOWLEDGEMENT'], ['B', 'C'])
    if not ids:
        return
    conn.execute(
        sa.text(
            "UPDATE packages SET status = CAST("
            "array_append(array_append(array_remove(status::text[], 'READY_FOR_ACKNOWLEDGEMENT'), "
            "'VERIFIED'), 'PENDING_ACKNOWLEDGEMENT') AS packagestatus[]) WHERE id = ANY(:ids)"
        ),
        {"ids": ids},
    )