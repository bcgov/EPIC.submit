"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields, post_dump, validate

from submit_api.models.package import PackageStatus, NonCanonicalPackageStatus
from submit_api.models.submission_review import SubmissionReviewStatus
from submit_api.models.update_request import UpdateRequestType
from submit_api.models.user import UserType
from submit_api.schemas.item import ItemSchema, StaffItemSchema
from submit_api.schemas.package_type import PackageTypeSchema
from submit_api.schemas.account_project_work import AccountProjectWorkSchema
from submit_api.services.user_service import UserService
from submit_api.utils.token_info import TokenInfo
from submit_api.schemas.internal_staff_document import InternalStaffDocumentSchema


class PackageVersionSchema(Schema):
    """Schema for serializing individual package versions."""

    id = fields.Int(data_key="id")
    package_id = fields.Method('get_package_id')
    original_package_id = fields.Int(data_key="original_package_id")
    version = fields.Int(data_key="version")
    is_approved = fields.Method('get_is_approved')

    @staticmethod
    def get_package_id(obj):
        """Get package id."""
        return obj.package.id if obj.package else None

    @staticmethod
    def get_is_approved(obj):
        """Get package id."""
        return obj.package.completed_on is not None


class CreatePackageVersionSchema(Schema):
    """Create package version schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    version = fields.Int(data_key="version")
    original_package_id = fields.Int(data_key="original_package_id")
    package_id = fields.Int(data_key="package_id")


class PostPackageRequestSchema(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    name = fields.Str(data_key="name")
    description = fields.Str(data_key="description", required=False)
    metadata = fields.Dict(data_key="metadata")
    type = fields.Str(data_key="type")
    account_project_work_id = fields.Int(data_key="account_project_work_id", required=False, allow_none=True)


class PostPackageState(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    status = fields.Str(data_key="status")


class CreateUpdateRequestSchema(Schema):
    """create update request schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    submission_item_types = fields.List(fields.Int(), data_key="submission_item_types",
                                        required=True, validate=validate.Length(min=1))
    reason = fields.Str(data_key="reason", required=True,
                        validate=validate.Length(min=1))


class CreateUpdateRequestNoteSchema(Schema):
    """create update request note schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    note = fields.Str(data_key="note", validate=validate.Length(max=500))


class PackageUpdateRequestSchema(Schema):
    """package update request schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    submission_package_id = fields.Int(data_key="submission_package_id")
    submission_item_types = fields.List(
        fields.Int(), data_key="submission_item_types")
    active = fields.Bool(data_key="active")
    reason = fields.Str(data_key="reason")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Method('get_created_by')
    type = fields.Enum(data_key="type", enum=UpdateRequestType)
    note = fields.Str(data_key="note")
    note_updated_by = fields.Method('get_note_updated_by')
    note_updated_at = fields.DateTime(data_key="note_updated_at")
    status = fields.Str(data_key="status")

    def get_created_by(self, obj):
        """Get created by user."""
        return obj.created_by_user.staff_user.full_name \
            if obj.created_by_user and obj.created_by_user.staff_user else None

    def get_note_updated_by(self, obj):
        """Get note updated by user (proponent)."""
        if obj.note_updated_by_user and obj.note_updated_by_user.account_user:
            return obj.note_updated_by_user.account_user.full_name
        return None


class PackageSchema(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    account_project_id = fields.Int(data_key="account_project_id")
    name = fields.Str(data_key="name")
    description = fields.Str(data_key="description")
    type = fields.Nested(PackageTypeSchema, data_key="type")
    type_id = fields.Int(data_key="type_id")
    status = fields.List(fields.Enum(enum=PackageStatus), data_key="status", metadata={"enum": PackageStatus})
    submitted_on = fields.DateTime(data_key="submitted_on")
    submitted_by = fields.Method('get_submitted_by')
    completed_on = fields.DateTime(data_key="completed_on")
    meta = fields.Method('get_meta')
    items = fields.Nested(ItemSchema, data_key="items", many=True)
    update_requests = fields.Nested(
        PackageUpdateRequestSchema, data_key="update_requests", many=True)
    all_update_requests = fields.Method('get_all_update_requests')
    version = fields.Nested(PackageVersionSchema,
                            data_key="version", exclude=["package_id"])
    account_project_work = fields.Nested(
        AccountProjectWorkSchema, data_key="account_project_work", allow_none=True)

    def get_submitted_by(self, obj):
        """Get submitted by."""
        submitted_by = obj.submitted_by_user.account_user.full_name \
            if obj.submitted_by_user and obj.submitted_by_user.account_user else None
        return submitted_by

    def get_meta(self, obj):
        """Get meta."""
        return obj.meta.json if obj.meta else None

    def get_all_update_requests(self, obj):
        """Get all update requests (active and inactive)."""
        return PackageUpdateRequestSchema(many=True).dump(obj.all_update_requests)

    @post_dump
    def map_status(self, data, many, **kwargs):
        """Map status."""
        auth_guid = TokenInfo.get_username()
        if not auth_guid:
            data['status'] = []
            return data
        user = UserService.get_by_auth_guid(auth_guid)
        user_type = user.type if user else None

        version = data.get('version')
        package_type_data = data.get('type')

        new_status = [get_package_status(status, user_type, version, package_type_data)
                      for status in data['status']]

        # Add non-canonical statuses
        update_requests = data.get('update_requests', [])
        is_update_requested = any(ur.get('active') and ur.get('status') != 'COMPLETED' for ur in update_requests)

        # Check if any item has REVISION_REQUIRED
        items = data.get('items', [])
        is_revision_required = any(item.get('status') == 'REVISION_REQUIRED' for item in items)

        if is_update_requested:
            new_status.append(NonCanonicalPackageStatus.UPDATE_REQUESTED.value)

        if is_revision_required:
            if user_type == UserType.PROPONENT:
                new_status.append(NonCanonicalPackageStatus.REVISION_REQUIRED.value)
            else:
                new_status.append(NonCanonicalPackageStatus.REVISION_REQUESTED.value)

        # Return new status list while preserving insertion order
        seen = set()
        deduped_status = []
        for status in new_status:
            if status and status not in seen:
                seen.add(status)
                deduped_status.append(status)
        data['status'] = deduped_status

        return data


class StaffPackageSchema(PackageSchema):
    """staff package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    items = fields.Nested(StaffItemSchema, data_key="items", many=True)
    internal_staff_documents = fields.Nested(InternalStaffDocumentSchema,
                                             data_key="internal_staff_documents",
                                             many=True)
    review_status = fields.Method('get_review_status')
    update_requests = fields.Nested(
        PackageUpdateRequestSchema, data_key="update_requests", many=True, attribute="all_update_requests")

    def get_review_status(self, package):
        """Add review status."""
        reviews = [item.review for item in package.items if item.review]
        pending_manager_review = any(review.status == SubmissionReviewStatus.PENDING_MANAGER_REVIEW
                                     for review in reviews)
        if pending_manager_review:
            return SubmissionReviewStatus.PENDING_MANAGER_REVIEW.value
        return None


def get_package_status(status, user_type, version_obj, package_type=None):
    """Get the local (Pacific Timezone) datetime."""
    if not status:
        return None
    if user_type not in [UserType.PROPONENT, UserType.STAFF]:
        return status

    version = 1
    if version_obj and isinstance(version_obj, dict):
        version = version_obj.get('version', 1) or 1

    versioning_enabled = package_type.get('versioning_enabled', True) if isinstance(package_type, dict) else True
    package_status_mapping = {
        PackageStatus.NEW.value: {
            UserType.PROPONENT: PackageStatus.NEW.value if version == 1 else '',
            UserType.STAFF: PackageStatus.CREATED.value if version == 1 else ''
        },
        PackageStatus.PARTIALLY_COMPLETED.value: {
            UserType.PROPONENT: PackageStatus.PARTIALLY_COMPLETED.value,
            UserType.STAFF: PackageStatus.CREATED.value if version == 1 else ''
        },
        PackageStatus.COMPLETED.value: {
            UserType.PROPONENT: PackageStatus.COMPLETED.value,
            UserType.STAFF: PackageStatus.CREATED.value if version == 1 else ''
        },
        PackageStatus.SUBMITTED.value: {
            UserType.PROPONENT: PackageStatus.SUBMITTED.value,
            UserType.STAFF: (PackageStatus.SUBMITTED.value if not versioning_enabled
                             else (PackageStatus.NEW_SUBMISSION.value if version == 1
                                   else PackageStatus.RESUBMITTED.value))
        },
        PackageStatus.UNDER_REVIEW.value: {
            UserType.PROPONENT: PackageStatus.UNDER_REVIEW.value,
            UserType.STAFF: PackageStatus.UNDER_REVIEW.value
        },
        PackageStatus.UNDER_CONSULTATION_CHECK.value: {
            UserType.PROPONENT: PackageStatus.UNDER_CONSULTATION_CHECK.value,
            UserType.STAFF: PackageStatus.UNDER_CONSULTATION_CHECK.value
        },
        PackageStatus.CC_AWAITING_MANAGER_APPROVAL.value: {
            UserType.PROPONENT: PackageStatus.UNDER_CONSULTATION_CHECK.value,
            UserType.STAFF: PackageStatus.AWAITING_MANAGER_APPROVAL.value
        },
        PackageStatus.MP_AWAITING_MANAGER_APPROVAL.value: {
            UserType.PROPONENT: PackageStatus.UNDER_REVIEW.value,
            UserType.STAFF: PackageStatus.AWAITING_MANAGER_APPROVAL.value
        },
        PackageStatus.IEM_AWAITING_MANAGER_APPROVAL.value: {
            UserType.PROPONENT: PackageStatus.UNDER_REVIEW.value,
            UserType.STAFF: PackageStatus.AWAITING_MANAGER_APPROVAL.value
        },
        PackageStatus.REVIEW_REJECTED.value: {
            UserType.PROPONENT: PackageStatus.REVISION_REQUIRED.value,
            UserType.STAFF: PackageStatus.REVIEW_REJECTED.value
        },
        PackageStatus.SATISFIED.value: {
            UserType.PROPONENT: PackageStatus.NO_REVISION_REQUIRED.value,
            UserType.STAFF: PackageStatus.SATISFIED.value
        },
        PackageStatus.REVIEWED.value: {
            UserType.PROPONENT: PackageStatus.REVIEWED.value,
            UserType.STAFF: PackageStatus.REVIEWED.value
        },
        PackageStatus.IN_PROGRESS.value: {
            UserType.PROPONENT: PackageStatus.IN_PROGRESS.value,
            UserType.STAFF: PackageStatus.CREATED.value if not versioning_enabled else PackageStatus.IN_PROGRESS.value
        },
    }

    if status in package_status_mapping:
        return package_status_mapping[status][user_type]

    return status


class AccountPackageSchema(Schema):
    """Account project schema with embedded package details."""

    class PackageDetailsSchema(Schema):
        """Schema representing a single package."""

        id = fields.Int(data_key="id")
        name = fields.Str(data_key="name")
        original_package_id = fields.Int(data_key="original_package_id")

    project_id = fields.Int(data_key="project_id")
    account_packages = fields.List(fields.Nested(
        PackageDetailsSchema), data_key="packages")
