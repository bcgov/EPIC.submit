"""Item schema class.

Manages the item schema
"""

from marshmallow import EXCLUDE, Schema, fields, pre_dump, post_dump

from submit_api.enums.item_status import ItemStatus
from submit_api.models.submission import SubmissionType, SubmissionStatus
from submit_api.models.user import UserType
from submit_api.schemas.internal_staff_document import InternalStaffDocumentSchema
from submit_api.schemas.item_type import ItemTypeSchema
from submit_api.schemas.submission import SubmittedDocumentSchema, SubmittedFormSchema
from submit_api.schemas.submission_item_note import SubmissionItemNote
from submit_api.schemas.submission_review import SubmissionReviewSchema
from submit_api.services.user_service import UserService
from submit_api.utils.token_info import TokenInfo


class ItemSubmissionSchema(Schema):
    """submission schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    item_id = fields.Int(data_key="item_id")
    type = fields.Enum(data_key="type", enum=SubmissionType)
    submitted_document_id = fields.Int(data_key="submitted_document_id")
    submitted_form_id = fields.Int(data_key="submitted_form_id")
    submitted_form = fields.Nested(SubmittedFormSchema, data_key="submitted_form")
    submitted_document = fields.Nested(SubmittedDocumentSchema, data_key="submitted_document")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")
    submitted_by = fields.Str(data_key="submitted_by")
    version = fields.Str(data_key="version")
    status = fields.Enum(data_key="status", enum=SubmissionStatus)

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = obj.submitted_by_user.account_user.full_name\
            if obj.submitted_by_user and obj.submitted_by_user.account_user else None
        return obj


class ItemSchema(Schema):
    """item schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    package_id = fields.Int(data_key="package_id")
    type_id = fields.Int(data_key="type_id")
    type = fields.Nested(ItemTypeSchema, data_key="type")
    status = fields.Enum(data_key="status", enum=ItemStatus)
    version = fields.Int(data_key="version")
    submitted_on = fields.DateTime(data_key="submitted_on")
    submitted_by = fields.Str(data_key="submitted_by")
    submissions = fields.Nested(ItemSubmissionSchema, data_key="submissions", many=True)
    sort_order = fields.Int(data_key="sort_order")

    @post_dump
    def map_status(self, data, many, **kwargs):
        """Map status."""
        auth_guid = TokenInfo.get_id()
        if not auth_guid:
            data['status'] = []
            return data
        user = UserService.get_by_auth_guid(auth_guid)
        user_type = user.type if user else None

        status = data['status']
        new_status = get_item_status(status, user_type)

        data['status'] = new_status

        return data


def get_item_status(status, user_type):
    """Get the local (Pacific Timezone) datetime."""
    if not status:
        return None
    if user_type not in [UserType.PROPONENT, UserType.STAFF]:
        return status

    package_status_mapping = {
        ItemStatus.NEW_SUBMISSION.value: {
            UserType.PROPONENT: '',
            UserType.STAFF: ''
        },
        ItemStatus.PARTIALLY_COMPLETED.value: {
            UserType.PROPONENT: ItemStatus.PARTIALLY_COMPLETED.value,
            UserType.STAFF: ''
        },
        ItemStatus.COMPLETED.value: {
            UserType.PROPONENT: ItemStatus.COMPLETED.value,
            UserType.STAFF: ''
        },
        ItemStatus.SUBMITTED.value: {
            UserType.PROPONENT: '',
            UserType.STAFF: ''
        },
        ItemStatus.FAILED_CONSULTATION_CHECK.value: {
            UserType.PROPONENT: '',
            UserType.STAFF: ItemStatus.FAILED_CONSULTATION_CHECK.value
        },
    }
    if status in package_status_mapping:
        return package_status_mapping[status][user_type]

    return status


class StaffItemSchema(ItemSchema):
    """item schema for staff."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    internal_staff_documents = fields.Nested(InternalStaffDocumentSchema,
                                             data_key="internal_staff_documents", many=True)
    review = fields.Nested(SubmissionReviewSchema, data_key="review")
    notes = fields.Nested(SubmissionItemNote, data_key="notes", many=True)
    review_start_date = fields.DateTime(data_key="review_start_date")
