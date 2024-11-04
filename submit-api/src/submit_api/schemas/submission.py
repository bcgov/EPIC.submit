"""Submission schema class.

Manages the submission schema
"""

from marshmallow import EXCLUDE, Schema, fields, pre_dump


class SubmittedFormSchema(Schema):
    """submitted form schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    submission_json = fields.Dict(data_key="submission_json")
    form_id = fields.Int(data_key="form_id")


class SubmittedDocumentSchema(Schema):
    """document schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    url = fields.Str(data_key="url")
    folder = fields.Str(data_key="folder")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")


class SubmissionSchema(Schema):
    """submission schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    item_id = fields.Int(data_key="item_id")
    type = fields.Str(data_key="type")
    submitted_document_id = fields.Int(data_key="submitted_document_id")
    submitted_form_id = fields.Int(data_key="submitted_form_id")
    submitted_form = fields.Nested(SubmittedFormSchema, data_key="submitted_form")
    submitted_document = fields.Nested(SubmittedDocumentSchema, data_key="submitted_document")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")
    submitted_by = fields.Str(data_key="submitted_by")
    version = fields.Int(data_key="version")

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = obj.submitted_by_user.account_user.full_name if obj.submitted_by_user else None
        return obj


class CreateSubmissionRequestSchema(Schema):
    """Create submission request schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    type = fields.Str(data_key="type")
    status = fields.Str(data_key="status")
    data = fields.Dict(data_key="data")
    item_id = fields.Int(data_key="item_id")
