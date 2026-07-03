"""Package model class.

Manages the package
"""

from marshmallow import EXCLUDE, Schema, fields, post_dump, validate

from submit_api.models.package import PackageStatus
from submit_api.models.submission_review import SubmissionReviewStatus
from submit_api.models.update_request import UpdateRequestType
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


class RefusePackageSchema(Schema):
    """refuse package schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    decision_date = fields.DateTime(dataKey="decision_date")
    reason = fields.Str(data_key="reason")


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
    internal_staff_documents = fields.Nested(InternalStaffDocumentSchema,
                                             data_key="internal_staff_documents",
                                             many=True)

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

    @post_dump(pass_original=True)
    def map_status(self, data, original_data, **kwargs):
        """Map status."""
        # Check if status was pre-calculated by the service layer
        # This is set by ProjectQueries for optimized queries
        if original_data and hasattr(original_data, '_calculated_status'):
            data['status'] = original_data._calculated_status
            return data

        # Fallback: Use service method to calculate statuses
        # This ensures consistency across all endpoints
        auth_guid = TokenInfo.get_username()
        if not auth_guid:
            data['status'] = []
            return data

        user = UserService.get_by_auth_guid(auth_guid)
        user_type = user.type if user else None

        if original_data and user_type:
            # Lazy import to avoid circular dependency
            from submit_api.services.package_service import PackageService
            # Call the service method with the original package object
            data['status'] = PackageService.calculate_package_statuses(original_data, user_type)
        else:
            data['status'] = []

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
