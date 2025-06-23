"""Item schema class.

Manages the item schema
"""

from marshmallow import EXCLUDE, Schema, fields, pre_dump, post_dump
from submit_api.enums.item_status import ItemStatus
from submit_api.models.submission import SubmissionType, SubmissionStatus
from submit_api.models.user import UserType
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
    submitted_form = fields.Nested(
        SubmittedFormSchema, data_key="submitted_form")
    submitted_document = fields.Nested(
        SubmittedDocumentSchema, data_key="submitted_document")
    created_date = fields.DateTime(data_key="created_date")
    created_by = fields.Str(data_key="created_by")
    submitted_by = fields.Str(data_key="submitted_by")
    version = fields.Str(data_key="version")
    minor_version = fields.Int(data_key="minor_version")
    major_version = fields.Int(data_key="major_version")
    status = fields.Enum(data_key="status", enum=SubmissionStatus)

    @pre_dump
    def get_submitted_by(self, obj, **kwargs):
        """Get submitted by."""
        obj.submitted_by = (
            obj.submitted_by_user.account_user.full_name
            if obj.submitted_by_user and obj.submitted_by_user.account_user
            else None
        )
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
    submissions = fields.Method('filter_submissions_by_status')
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

    def filter_submissions_by_status(self, obj):
        """Filter submissions based on their status before returning the item."""
        # Filter out submissions that are replaced
        pending_submissions = set(submission.root_submission_id for submission in obj.submissions
                                  if submission.status == SubmissionStatus.PENDING)
        replaced_submissions = set(submission.id for submission in obj.submissions
                                   if submission.status != SubmissionStatus.PENDING and submission.root_submission_id
                                   in pending_submissions)
        result = [
            ItemSubmissionSchema().dump(sub)
            for sub in obj.submissions
            if sub.id not in replaced_submissions
        ]
        return result


def get_item_status(status, user_type):
    """Get the local (Pacific Timezone) datetime."""
    if not status:
        return None
    if user_type not in [UserType.PROPONENT, UserType.STAFF]:
        return status

    package_status_mapping = {
        ItemStatus.NEW.value: {UserType.PROPONENT: "", UserType.STAFF: ""},
        ItemStatus.PARTIALLY_COMPLETED.value: {
            UserType.PROPONENT: ItemStatus.PARTIALLY_COMPLETED.value,
            UserType.STAFF: ''
        },
        ItemStatus.COMPLETED.value: {
            UserType.PROPONENT: ItemStatus.COMPLETED.value,
            UserType.STAFF: ''
        },
        ItemStatus.CC_AWAITING_MANAGER_APPROVAL.value: {
            UserType.PROPONENT: ItemStatus.UNDER_CONSULTATION_CHECK.value,
            UserType.STAFF: ItemStatus.AWAITING_MANAGER_APPROVAL.value,
        },
        ItemStatus.MP_AWAITING_MANAGER_APPROVAL.value: {
            UserType.PROPONENT: ItemStatus.UNDER_REVIEW.value,
            UserType.STAFF: ItemStatus.AWAITING_MANAGER_APPROVAL.value
        },
        ItemStatus.IEM_AWAITING_MANAGER_APPROVAL.value: {
            UserType.PROPONENT: ItemStatus.UNDER_REVIEW.value,
            UserType.STAFF: ItemStatus.AWAITING_MANAGER_APPROVAL.value
        },
        ItemStatus.REVIEW_REJECTED.value: {
            UserType.PROPONENT: ItemStatus.REVISION_REQUIRED.value,
            UserType.STAFF: ItemStatus.REVIEW_REJECTED.value
        },
        ItemStatus.SATISFIED.value: {
            UserType.PROPONENT: ItemStatus.NO_REVISION_REQUIRED.value,
            UserType.STAFF: ItemStatus.SATISFIED.value
        },
        ItemStatus.REVIEWED.value: {
            UserType.PROPONENT: ItemStatus.REVIEWED.value,
            UserType.STAFF: ItemStatus.REVIEWED.value
        }
    }
    if status in package_status_mapping:
        return package_status_mapping[status][user_type]

    return status


class StaffItemSchema(ItemSchema):
    """item schema for staff."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    review = fields.Nested(SubmissionReviewSchema, data_key="review")
    notes = fields.Nested(SubmissionItemNote, data_key="notes", many=True)
    review_start_date = fields.DateTime(data_key="review_start_date")
    submissions = fields.Method('get_submitted_submissions')

    def get_submitted_submissions(self, obj):
        """Get only non-PENDING submissions."""
        result = [
            ItemSubmissionSchema().dump(sub)
            for sub in obj.submissions
            if sub.status not in [SubmissionStatus.PENDING]
        ]
        return result
