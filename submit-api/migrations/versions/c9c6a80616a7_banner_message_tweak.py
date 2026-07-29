"""banner message tweak

Revision ID: c9c6a80616a7
Revises: f2a7b3c4d5e6
Create Date: 2026-07-27 10:49:15.240111

Updates banner messages:
- Management Plan & IEM: changes "Your plan" to "Your submission" so the message
  works for both Management Plan and IEM submission types.
- Additional Information: uses the same IPD-style message with acknowledgement info.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c9c6a80616a7'
down_revision = 'f2a7b3c4d5e6'
branch_labels = None
depends_on = None

# Unified MP/IEM message (changed "plan" to "submission")
MP_IEM_SUCCESS_MESSAGE_NEW = (
    "Your submission has been successfully submitted to the EAO. "
    "You will also receive an email to confirm your submission.\n"
    "If you have any questions or need to add, replace, or delete documents "
    "in your submission, please contact the EAO at {{contact_email}}"
)

# Previous MP message for downgrade
MP_SUCCESS_MESSAGE_OLD = (
    "Your plan has been successfully submitted to the EAO. "
    "You will also receive an email to confirm your submission.\n"
    "If you have any questions or need to add, replace, or delete documents "
    "in your submission, please contact the EAO at {{contact_email}}"
)

# Previous IEM message for downgrade
IEM_SUCCESS_MESSAGE_OLD = (
    "Your Independent Environmental Monitor Terms of Engagement has been successfully "
    "submitted to the EAO. You will also receive an email to confirm your submission.\n"
    "If you have any questions, please contact the EAO at {{contact_email}}"
)

# Additional Information now uses the same IPD-style message
AI_SUCCESS_MESSAGE_NEW = (
    "Your submission package has been successfully submitted to EAO.\n"
    "You can add or replace documents in your submission until your submission is acknowledged "
    "by the EAO, or after acknowledgement of submission, if requested by the EAO.\n"
    "If you have any questions, please contact the EAO at {{contact_email}}"
)

# Previous Additional Information message for downgrade
AI_SUCCESS_MESSAGE_OLD = (
    "Your Additional Information Submission has been successfully submitted to the EAO. "
    "You will also receive an email to confirm your submission.\n"
    "If you have any questions, please contact the EAO at {{contact_email}}"
)


def upgrade():
    """Update banner messages for MP, IEM, and Additional Information."""
    # Unify MP and IEM to use "Your submission" instead of "Your plan"
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :new_msg "
            "WHERE name = 'Management Plan'"
        ).bindparams(new_msg=MP_IEM_SUCCESS_MESSAGE_NEW)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :new_msg "
            "WHERE name = 'IEM'"
        ).bindparams(new_msg=MP_IEM_SUCCESS_MESSAGE_NEW)
    )

    # Additional Information uses the same IPD-style message
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :new_msg "
            "WHERE name = 'Additional Information'"
        ).bindparams(new_msg=AI_SUCCESS_MESSAGE_NEW)
    )


def downgrade():
    """Revert banner messages to previous values."""
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :old_msg "
            "WHERE name = 'Management Plan'"
        ).bindparams(old_msg=MP_SUCCESS_MESSAGE_OLD)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :old_msg "
            "WHERE name = 'IEM'"
        ).bindparams(old_msg=IEM_SUCCESS_MESSAGE_OLD)
    )
    op.execute(
        sa.text(
            "UPDATE package_types SET success_message = :old_msg "
            "WHERE name = 'Additional Information'"
        ).bindparams(old_msg=AI_SUCCESS_MESSAGE_OLD)
    )

