"""Submission schema class.

Manages the submission schema
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models.submission_review import SubmissionReviewStatus
from submit_api.models.submission_review_entry import SubmissionReviewEntryType


class SubmissionReviewEntrySchema(Schema):
    """submission review schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    review_id = fields.Int(data_key="review_id")
    type = fields.Enum(data_key="type", enum=SubmissionReviewEntryType)
    created_by = fields.Str(data_key="created_by")
    updated_by = fields.Method("get_updated_by")
    created_date = fields.DateTime(data_key="created_date")
    updated_date = fields.DateTime(data_key="updated_date")
    entry = fields.Dict(data_key="entry")

    def get_updated_by(self, obj):
        """Get submitted by."""
        updated_by = obj.updated_by_user.staff_user.full_name \
            if obj.updated_by_user and obj.updated_by_user.staff_user else None
        return updated_by


class SubmissionReviewSchema(Schema):
    """submission review schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    item_id = fields.Int(data_key="item_id")
    status = fields.Enum(data_key="status", enum=SubmissionReviewStatus)
    entries = fields.Nested(SubmissionReviewEntrySchema, data_key="entries", many=True)


class SaveSubmissionReviewRequestSchema(Schema):
    """submission review schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    form_answers = fields.Dict(data_key="form_answers")
    status = fields.Str(data_key="status")
    type = fields.Str(data_key="type")
