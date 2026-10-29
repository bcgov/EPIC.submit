"""Seed the Report_TypeB package type

Report_TypeB is a clone of the Report package type (same single
'Document(s) Upload' item, versioning disabled, same title/success message)
but with approval_type 'B'. Approval type B surfaces the Acknowledge step in
addition to Verify, following the existing approval-type-driven flow, whereas
the regular Report type uses approval_type 'A'.

Revision ID: a2b3c4d5e6f7
Revises: b1c2d3e4f5a7
Create Date: 2026-10-29 00:00:00.000000

"""
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a2b3c4d5e6f7'
down_revision = 'b1c2d3e4f5a7'
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
ITEM_SUBMISSION_METHOD = 'DOCUMENT_UPLOAD'


def upgrade():
    """Insert the Report_TypeB package type and link its item type if missing."""
    conn = op.get_bind()
    now = datetime.now(timezone.utc)

    # --- Item type (reuse the shared 'Document(s) Upload' type) ---
    row = conn.execute(
        sa.text("SELECT id FROM item_types WHERE name = :name"),
        {"name": ITEM_TYPE_NAME},
    ).fetchone()

    if row:
        item_type_id = row[0]
    else:
        result = conn.execute(
            sa.text(
                "INSERT INTO item_types (name, submission_method, created_date) "
                "VALUES (:name, :method, :now) RETURNING id"
            ),
            {"name": ITEM_TYPE_NAME, "method": ITEM_SUBMISSION_METHOD, "now": now},
        )
        item_type_id = result.fetchone()[0]

    # --- Package type ---
    row = conn.execute(
        sa.text("SELECT id FROM package_types WHERE name = :name AND phase_id IS NULL"),
        {"name": REPORT_TYPE_B_NAME},
    ).fetchone()

    if row:
        package_type_id = row[0]
    else:
        result = conn.execute(
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
        )
        package_type_id = result.fetchone()[0]

    # --- Link (package_item_types) ---
    row = conn.execute(
        sa.text(
            "SELECT 1 FROM package_item_types "
            "WHERE package_type_id = :pt AND item_type_id = :it"
        ),
        {"pt": package_type_id, "it": item_type_id},
    ).fetchone()

    if not row:
        conn.execute(
            sa.text(
                "INSERT INTO package_item_types "
                "(package_type_id, item_type_id, sort_order, is_required, created_date) "
                "VALUES (:pt, :it, 1, true, :now)"
            ),
            {"pt": package_type_id, "it": item_type_id, "now": now},
        )


def downgrade():
    """Remove the Report_TypeB package type and its link (keep the item type)."""
    conn = op.get_bind()

    row = conn.execute(
        sa.text("SELECT id FROM package_types WHERE name = :name AND phase_id IS NULL"),
        {"name": REPORT_TYPE_B_NAME},
    ).fetchone()

    if row:
        package_type_id = row[0]
        conn.execute(
            sa.text("DELETE FROM package_item_types WHERE package_type_id = :pt"),
            {"pt": package_type_id},
        )
        conn.execute(
            sa.text("DELETE FROM package_types WHERE id = :pt"),
            {"pt": package_type_id},
        )
