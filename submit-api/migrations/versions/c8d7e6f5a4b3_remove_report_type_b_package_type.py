"""Remove the Report_TypeB package type

Report_TypeB (a Report clone with the Acknowledge step) is no longer used: the
Compliance Self-Report acknowledge flow was removed and every report obligation now
uses the regular Report package type. This deletes the package type and its item type
links. It refuses to run if any package still references the type, so no package data
is ever lost or silently re-pointed.

Revision ID: c8d7e6f5a4b3
Revises: b9c8d7e6f5a4
Create Date: 2026-11-12 00:00:01.000000

"""
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c8d7e6f5a4b3'
down_revision = 'b9c8d7e6f5a4'
branch_labels = None
depends_on = None

REPORT_TYPE_B_NAME = 'Report_TypeB'
REPORT_TYPE_B_TITLE = 'Reports & Recurring Submissions'
REPORT_TYPE_B_SUCCESS_MESSAGE = (
    'Your submission has been successfully submitted to the EAO. '
    'You will also receive an email to confirm your submission.\n'
    'If you have any questions or need to add, replace, or delete documents '
    'in your submission, please contact the EAO at {{contact_email}}'
)
REPORT_TYPE_B_APPROVAL_TYPE = 'B'
ITEM_TYPE_NAME = 'Document(s) Upload'


def upgrade():
    """Delete the Report_TypeB package type and its links, if present and unused."""
    conn = op.get_bind()

    row = conn.execute(
        sa.text("SELECT id FROM package_types WHERE name = :name AND phase_id IS NULL"),
        {"name": REPORT_TYPE_B_NAME},
    ).fetchone()
    if not row:
        return
    package_type_id = row[0]

    in_use = conn.execute(
        sa.text("SELECT COUNT(*) FROM packages WHERE type_id = :pt"),
        {"pt": package_type_id},
    ).scalar()
    if in_use:
        raise RuntimeError(
            f"Cannot remove package type {REPORT_TYPE_B_NAME}: {in_use} package(s) still use it."
        )

    conn.execute(
        sa.text("DELETE FROM package_item_types WHERE package_type_id = :pt"),
        {"pt": package_type_id},
    )
    conn.execute(
        sa.text("DELETE FROM package_types WHERE id = :pt"),
        {"pt": package_type_id},
    )


def downgrade():
    """Re-seed the Report_TypeB package type and link the shared item type."""
    conn = op.get_bind()
    now = datetime.now(timezone.utc)

    item_row = conn.execute(
        sa.text("SELECT id FROM item_types WHERE name = :name"),
        {"name": ITEM_TYPE_NAME},
    ).fetchone()
    if not item_row:
        return
    item_type_id = item_row[0]

    row = conn.execute(
        sa.text("SELECT id FROM package_types WHERE name = :name AND phase_id IS NULL"),
        {"name": REPORT_TYPE_B_NAME},
    ).fetchone()
    if row:
        return

    package_type_id = conn.execute(
        sa.text(
            "INSERT INTO package_types "
            "(name, title, mandatory, versioning_enabled, approval_type, "
            "success_message, created_date) "
            "VALUES (:name, :title, :mandatory, :versioning, :approval_type, "
            ":msg, :now) RETURNING id"
        ),
        {
            "name": REPORT_TYPE_B_NAME,
            "title": REPORT_TYPE_B_TITLE,
            "mandatory": False,
            "versioning": False,
            "approval_type": REPORT_TYPE_B_APPROVAL_TYPE,
            "msg": REPORT_TYPE_B_SUCCESS_MESSAGE,
            "now": now,
        },
    ).fetchone()[0]

    conn.execute(
        sa.text(
            "INSERT INTO package_item_types "
            "(package_type_id, item_type_id, sort_order, is_required, created_date) "
            "VALUES (:pt, :it, 1, true, :now)"
        ),
        {"pt": package_type_id, "it": item_type_id, "now": now},
    )
