"""Submission schema class.

Manages the submission schema
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models.submission_review import SubmissionReviewStatus


class SubmissionReviewSchema(Schema):
    """submission review schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    form_answers = fields.Dict(data_key="form_answers")
    item_id = fields.Int(data_key="item_id")
    status = fields.Enum(data_key="status", enum=SubmissionReviewStatus)


class SubmissionReviewFormSchema(Schema):
    """submission review schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    staff = fields.Dict(data_key="staff", required=False)
    manager = fields.Dict(data_key="manager", required=False)


class SaveSubmissionReviewRequestSchema(Schema):
    """submission review schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    form_answers = fields.Nested(SubmissionReviewFormSchema, data_key="form_answers")
    status = fields.Str(data_key="status")
