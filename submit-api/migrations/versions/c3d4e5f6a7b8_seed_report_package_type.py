"""Seed Report package type and Document Upload item type.

Revision ID: c3d4e5f6a7b8
Revises: d7a38ed26f4f
Create Date: 2026-10-20 00:00:00.000000

"""
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'd7a38ed26f4f'
branch_labels = None
depends_on = None

REPORT_TYPE_NAME = 'Report'
REPORT_TYPE_TITLE = 'Reports & Recurring Submissions'
REPORT_SUCCESS_MESSAGE = (
    'Your submission has been successfully submitted to the EAO. '
    'You will also receive an email to confirm your submission.\n'
    'If you have any questions or need to add, replace, or delete documents '
    'in your submission, please contact the EAO at {{contact_email}}'
)
REPORT_APPROVAL_TYPE = 'A'
ITEM_TYPE_NAME = 'Document(s) Upload'
ITEM_SUBMISSION_METHOD = 'DOCUMENT_UPLOAD'


def upgrade():
    """Insert the Report package type and its item type if they do not exist."""
    conn = op.get_bind()
    now = datetime.now(timezone.utc)

    # --- Item type ---
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
        {"name": REPORT_TYPE_NAME},
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
                "name": REPORT_TYPE_NAME,
                "title": REPORT_TYPE_TITLE,
                "mandatory": False,
                "versioning": False,
                "approval_type": REPORT_APPROVAL_TYPE,
                "msg": REPORT_SUCCESS_MESSAGE,
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
    """Remove the seeded Report package type and its link (but keep the item type)."""
    conn = op.get_bind()

    row = conn.execute(
        sa.text("SELECT id FROM package_types WHERE name = :name AND phase_id IS NULL"),
        {"name": REPORT_TYPE_NAME},
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
