"""Submission schema class.

Manages the submission schema
"""

from flask import g, has_app_context
from marshmallow import EXCLUDE, Schema, fields, pre_dump

from submit_api.enums.item_status import ItemStatus
from submit_api.models.submission import (
    SUPPORTING_DOCUMENT_SORT_ORDER,
    SubmissionStatus,
)
from submit_api.models.submitted_document import VirusScanResult
from submit_api.models.user import UserType
from submit_api.services.user_service import UserService
from submit_api.utils.token_info import TokenInfo

EAO_SUBMITTER_LABEL = "EAO"
_VIEWER_IS_STAFF_KEY = "_submission_viewer_is_staff"


def viewer_is_staff() -> bool:
    """Return whether the current requester is an EAO staff user (cached per request)."""
    if has_app_context() and hasattr(g, _VIEWER_IS_STAFF_KEY):
        return getattr(g, _VIEWER_IS_STAFF_KEY)
    auth_guid = TokenInfo.get_username()
    user = UserService.get_by_auth_guid(auth_guid) if auth_guid else None
    is_staff = bool(user and user.type == UserType.STAFF)
    if has_app_context():
        setattr(g, _VIEWER_IS_STAFF_KEY, is_staff)
    return is_staff


def resolve_submitted_by(submission) -> str | None:
    """Return the display name of whoever submitted a document.

    EAO-uploaded documents show the staff member's name to staff and the literal
    "EAO" to everyone else, so staff names never reach the Regulated Party.
    """
    user = submission.submitted_by_user
    if getattr(submission, "is_eao_uploaded", False):
        if not viewer_is_staff():
            return EAO_SUBMITTER_LABEL
        return user.staff_user.full_name if user and user.staff_user else None
    return user.account_user.full_name if user and user.account_user else None


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
    is_virus_rejected = fields.Method("get_is_virus_rejected")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")

    def get_is_virus_rejected(self, obj):
        """Return whether the document failed its background security check."""
        return obj.virus_scan_result == VirusScanResult.REJECTED.value


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
    sort_order = fields.Int(data_key="sort_order")
    minor_version = fields.Int(data_key="minor_version")
    major_version = fields.Int(data_key="major_version")
    is_eao_uploaded = fields.Bool(data_key="is_eao_uploaded")
    received_date = fields.Date(data_key="received_date")

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = resolve_submitted_by(obj)
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
    # Missing priority is treated as supporting so only an explicit 0 satisfies main-file validation.
    sort_order = fields.Int(data_key="sort_order", load_default=SUPPORTING_DOCUMENT_SORT_ORDER)
    # EAO staff uploading on behalf of the Regulated Party (report/notification documents only).
    is_eao_upload = fields.Bool(data_key="is_eao_upload", load_default=False)
    received_date = fields.Date(data_key="received_date", load_default=None, allow_none=True)


class UpdateSubmissionStatusSchema(Schema):
    """Update submission status schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    status = fields.Str(data_key="status")


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
    project_name = fields.Str(data_key="project_name")
    work = fields.Method("get_work")
    phase = fields.Method("get_phase")
    version = fields.Method("get_version")
    submitted_on = fields.DateTime(data_key="submitted_on")
    status = fields.Enum(data_key="status", enum=ItemStatus)
    url = fields.Str(data_key="url")
    root_submission_id = fields.Int(data_key="root_submission_id")
    is_virus_rejected = fields.Method("get_is_virus_rejected")

    def get_is_virus_rejected(self, obj):
        """Return whether the document failed its background security check."""
        return obj.virus_scan_result == VirusScanResult.REJECTED.value

    def get_phase(self, obj):
        """Get the phase name."""
        if obj.has_approved_condition:
            return "Post Decision"
        return obj.phase_display_name if obj.phase_display_name else obj.phase_name

    def get_work(self, obj):
        """Get the work title."""
        if obj.has_approved_condition:
            return "Management Plan & Related Documents"
        return obj.work

    def get_version(self, obj):
        """Get the version."""
        if obj.major_version is not None and obj.minor_version is not None:
            return f"{obj.major_version}.{obj.minor_version}"
        return None
