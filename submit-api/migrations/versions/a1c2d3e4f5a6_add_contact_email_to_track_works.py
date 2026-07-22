"""Add contact_email to track_works and update IPD success_message

Revision ID: a1c2d3e4f5a6
Revises: d4e5f6a7b8c9
Create Date: 2026-07-17 10:00:00.000000

Adds a contact_email column to track_works for dynamic EAO contact in banners.
Updates IPD package_types success_message to include multi-paragraph text.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1c2d3e4f5a6'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None

# New IPD success message with paragraph break and email placeholder
IPD_SUCCESS_MESSAGE_NEW = (
    "Your submission package has been successfully submitted to EAO.\n"
    "You can add or replace documents in your submission until your submission is acknowledged "
    "by the EAO, or after acknowledgement of submission, if requested by the EAO.\n"
    "If you have any questions, please contact the EAO at {{contact_email}}"
)

# Original IPD success message for downgrade
IPD_SUCCESS_MESSAGE_OLD = (
    "Your Initial Project Description & Engagement Plan submission package "
    "has been successfully submitted to EAO."
)

# New MP success message with email placeholder
MP_SUCCESS_MESSAGE_NEW = (
    "Your plan has been successfully submitted to the EAO. "
    "You will also receive an email to confirm your submission.\n"
    "If you have any questions or need to add, replace, or delete documents "
    "in your submission, please contact the EAO at {{contact_email}}"
)

# Original MP success message for downgrade
MP_SUCCESS_MESSAGE_OLD = (
    "Your plan has been successfully submitted to the EAO. "
    "You will also receive an email to confirm your submission."
)

# New IEM success message with email placeholder
IEM_SUCCESS_MESSAGE_NEW = (
    "Your Independent Environmental Monitor Terms of Engagement has been successfully "
    "submitted to the EAO. You will also receive an email to confirm your submission.\n"
    "If you have any questions, please contact the EAO at {{contact_email}}"
)

# Original IEM success message for downgrade
IEM_SUCCESS_MESSAGE_OLD = (
    "Your Independent Environmental Monitor Terms of Engagement has been successfully "
    "submitted to the EAO. You will also receive an email to confirm your submission."
)

# New Additional Information success message with email placeholder
AI_SUCCESS_MESSAGE_NEW = (
    "Your Additional Information Submission has been successfully submitted to the EAO. "
    "You will also receive an email to confirm your submission.\n"
    "If you have any questions, please contact the EAO at {{contact_email}}"
)

# Original Additional Information success message for downgrade
AI_SUCCESS_MESSAGE_OLD = (
    "Your Additional Information Submission has been successfully submitted to the EAO. "
    "You will also receive an email to confirm your submission."
)


def upgrade():
    """Add contact_email column, widen success_message, and update messages."""
    with op.batch_alter_table('track_works', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'contact_email',
                sa.String(length=200),
                nullable=True,
                comment='Contact email for the work from EPIC.track'
            )
        )

    # Widen success_message column from VARCHAR(255) to TEXT
    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.alter_column(
            'success_message',
            existing_type=sa.String(length=255),
            type_=sa.Text(),
            existing_nullable=True,
        )

    # Update success_message for all package types to include {{contact_email}} placeholder
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :new_msg WHERE name = 'IPD'"
        ).bindparams(new_msg=IPD_SUCCESS_MESSAGE_NEW)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :new_msg WHERE name = 'Management Plan'"
        ).bindparams(new_msg=MP_SUCCESS_MESSAGE_NEW)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :new_msg WHERE name = 'IEM'"
        ).bindparams(new_msg=IEM_SUCCESS_MESSAGE_NEW)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :new_msg WHERE name = 'Additional Information'"
        ).bindparams(new_msg=AI_SUCCESS_MESSAGE_NEW)
    )


def downgrade():
    """Remove contact_email column, revert success messages, and shrink column."""
    with op.batch_alter_table('track_works', schema=None) as batch_op:
        batch_op.drop_column('contact_email')

    # Revert success_message for all package types
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :old_msg WHERE name = 'IPD'"
        ).bindparams(old_msg=IPD_SUCCESS_MESSAGE_OLD)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :old_msg WHERE name = 'Management Plan'"
        ).bindparams(old_msg=MP_SUCCESS_MESSAGE_OLD)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :old_msg WHERE name = 'IEM'"
        ).bindparams(old_msg=IEM_SUCCESS_MESSAGE_OLD)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :old_msg WHERE name = 'Additional Information'"
        ).bindparams(old_msg=AI_SUCCESS_MESSAGE_OLD)
    )

    # Revert success_message column from TEXT back to VARCHAR(255)
    with op.batch_alter_table('package_types', schema=None) as batch_op:
        batch_op.alter_column(
            'success_message',
            existing_type=sa.Text(),
            type_=sa.String(length=255),
            existing_nullable=True,
        )
