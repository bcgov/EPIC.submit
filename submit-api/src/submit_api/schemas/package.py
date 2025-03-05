"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields, post_dump, validate

from submit_api.models.package import PackageStatus
from submit_api.models.submission_review import SubmissionReviewStatus
from submit_api.models.update_request import UpdateRequestType
from submit_api.models.user import UserType
from submit_api.schemas.item import ItemSchema, StaffItemSchema
from submit_api.schemas.package_type import PackageTypeSchema
from submit_api.services.user_service import UserService
from submit_api.utils.token_info import TokenInfo


class PackageVersionSchema(Schema):
    """Schema for serializing individual package versions."""

    id = fields.Int(data_key="id")
    package_id = fields.Method('get_package')
    original_package_id = fields.Int(data_key="original_package_id")
    version = fields.Int(data_key="version")

    def get_package(self, obj):
        """Get package."""
        return obj.package.id if obj.package else None


class PostPackageRequestSchema(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    name = fields.Str(data_key="name")
    metadata = fields.Dict(data_key="metadata")
    type = fields.Str(data_key="type")


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
    status = fields.Str(data_key="status")

    def get_created_by(self, obj):
        """Get created by user."""
        return obj.created_by_user.staff_user.full_name \
            if obj.created_by_user and obj.created_by_user.staff_user else None


class PackageSchema(Schema):
    """package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    account_project_id = fields.Int(data_key="account_project_id")
    name = fields.Str(data_key="name")
    type = fields.Nested(PackageTypeSchema, data_key="type")
    type_id = fields.Int(data_key="type_id")
    status = fields.List(fields.Enum(enum=PackageStatus),
                         enum=PackageStatus, data_key="status")
    submitted_on = fields.DateTime(data_key="submitted_on")
    submitted_by = fields.Method('get_submitted_by')
    completed_on = fields.DateTime(data_key="completed_on")
    meta = fields.Method('get_meta')
    items = fields.Nested(ItemSchema, data_key="items", many=True)
    update_requests = fields.Nested(
        PackageUpdateRequestSchema, data_key="update_requests", many=True)
    version = fields.Nested(PackageVersionSchema, data_key="version", exclude=["package_id"])

    def get_submitted_by(self, obj):
        """Get submitted by."""
        submitted_by = obj.submitted_by_user.account_user.full_name \
            if obj.submitted_by_user and obj.submitted_by_user.account_user else None
        return submitted_by

    def get_meta(self, obj):
        """Get meta."""
        return obj.meta.json if obj.meta else None

    @post_dump
    def map_status(self, data, many, **kwargs):
        """Map status."""
        auth_guid = TokenInfo.get_id()
        if not auth_guid:
            data['status'] = []
            return data
        user = UserService.get_by_auth_guid(auth_guid)
        user_type = user.type if user else None

        version = data['version']
        new_status = [get_package_status(status, user_type, version)
                      for status in data['status']]
        new_status = set(status for status in new_status if status)
        data['status'] = list(new_status)

        return data


class StaffPackageSchema(PackageSchema):
    """staff package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    items = fields.Nested(StaffItemSchema, data_key="items", many=True)
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


def get_package_status(status, user_type, version_obj):
    """Get the local (Pacific Timezone) datetime."""
    if not status:
        return None
    if user_type not in [UserType.PROPONENT, UserType.STAFF]:
        return status

    version = version_obj.get('version') if version_obj else 1
    package_status_mapping = {
        PackageStatus.NEW_SUBMISSION.value: {
            UserType.PROPONENT: PackageStatus.NEW_SUBMISSION.value if version == 1 else '',
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
            UserType.STAFF: PackageStatus.NEW_SUBMISSION.value
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
        PackageStatus.REVIEW_REJECTED.value: {
            UserType.PROPONENT: PackageStatus.REVISION_REQUIRED.value,
            UserType.STAFF: PackageStatus.REVIEW_REJECTED.value
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

    project_id = fields.Int(data_key="project_id")
    account_packages = fields.List(fields.Nested(PackageDetailsSchema), data_key="packages")
