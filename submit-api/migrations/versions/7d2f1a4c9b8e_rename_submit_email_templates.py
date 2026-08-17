"""rename submit email templates

Revision ID: 7d2f1a4c9b8e
Revises: b2c3d4e5f6a7
Create Date: 2026-08-18 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '7d2f1a4c9b8e'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        UPDATE email_queue
        SET template_name = CASE template_name
            WHEN 'management_plan_submission_notify_staff.html' THEN 'submission_notify_staff.html'
            WHEN 'management_plan_update_request_created.html' THEN 'update_request_created.html'
            WHEN 'resubmission_request.html' THEN 'management_plan_resubmission_request.html'
            ELSE template_name
        END
        WHERE status = 'PENDING'
          AND template_name IN (
            'management_plan_submission_notify_staff.html',
            'management_plan_update_request_created.html',
            'resubmission_request.html'
          )
    """)


def downgrade():
    op.execute("""
        UPDATE email_queue
        SET template_name = CASE template_name
            WHEN 'submission_notify_staff.html' THEN 'management_plan_submission_notify_staff.html'
            WHEN 'update_request_created.html' THEN 'management_plan_update_request_created.html'
            WHEN 'management_plan_resubmission_request.html' THEN 'resubmission_request.html'
            ELSE template_name
        END
        WHERE status = 'PENDING'
          AND template_name IN (
            'submission_notify_staff.html',
            'update_request_created.html',
            'management_plan_resubmission_request.html'
          )
    """)
