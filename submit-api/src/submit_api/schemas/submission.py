"""Submission schema class.

Manages the submission schema
"""

from marshmallow import EXCLUDE, Schema, fields, pre_dump

from submit_api.enums.item_status import ItemStatus
from submit_api.models.submission import SubmissionStatus


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
    submitted_by = fields.Str(data_key="submitted_by")
    version = fields.Str(data_key="version")
    status = fields.Enum(data_key="status", enum=SubmissionStatus)
    minor_version = fields.Int(data_key="minor_version")
    major_version = fields.Int(data_key="major_version")

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = obj.submitted_by_user.account_user.full_name\
            if obj.submitted_by_user and obj.submitted_by_user.account_user else None
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
    created_by = fields.Str(data_key="created_by", required=False)


class SubmittedDocumentByProjectSchema(Schema):
    """Submitted document schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    url = fields.Str(data_key="url")
    project_name = fields.Str(data_key="project_name")
    status = fields.Enum(data_key="status", enum=ItemStatus)
    submitted_on = fields.DateTime(data_key="submitted_on")
    version = fields.Str(data_key="version")


class PaginatedProjectDocumentItemSchema(Schema):
    """Paginated project document item schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    name = fields.Str(data_key="name")
    work = fields.Str(data_key="work")
    phase = fields.Method("get_phase")
    version = fields.Method("get_version")
    submitted_on = fields.DateTime(data_key="submitted_on")
    status = fields.Enum(data_key="status", enum=ItemStatus)
    url = fields.Str(data_key="url")
    root_submission_id = fields.Int(data_key="root_submission_id")


    def get_phase(self, obj):
        """Get the phase name."""
        return obj.phase_display_name if obj.phase_display_name else obj.phase_name

    def get_version(self, obj):
        """Get the version."""
        if obj.major_version is not None and obj.minor_version is not None:
            return f"{obj.major_version}.{obj.minor_version}"
        return None

