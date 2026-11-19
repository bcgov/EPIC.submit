"""Response timestamps identify UTC without changing stored values or request parsing."""
from datetime import UTC, date, datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

from flask import Flask
from flask_restx import Namespace, fields as restx_fields
from marshmallow import fields
import pytest

from submit_api.resources.apihelper import Api
from submit_api.schemas.account_user import AccountUserSchema
from submit_api.schemas.activity_log import ActivityLogSchema
from submit_api.schemas.fields import UTCDateTime
from submit_api.schemas.invitation import InvitationSchema
from submit_api.schemas.item import ItemSchema, ItemSubmissionSchema, StaffItemSchema
from submit_api.schemas.package import PackageSchema, PackageUpdateRequestSchema, PostPackageState
from submit_api.schemas.submission import SubmittedDocumentSchema, SubmissionSchema
from submit_api.schemas.submission_item_note import SubmissionItemNote
from submit_api.schemas.submission_review import SubmissionReviewEntrySchema
from submit_api.services.account_user_service import AccountUserService


@pytest.fixture(scope='session', autouse=True)
def cleanup_database():
    """Serialization tests do not access the database."""
    yield


@pytest.fixture(autouse=True)
def app_context():
    """Provide a lightweight Flask context for schema construction."""
    with Flask(__name__).app_context():
        yield


@pytest.mark.parametrize('timestamp', [
    datetime(2026, 11, 19, 6, 30, 0, 123456),
    datetime(2026, 11, 19, 6, 30, 0, 123456, tzinfo=UTC),
    datetime(2026, 11, 19, 11, 30, 0, 123456, tzinfo=timezone(timedelta(hours=5))),
])
def test_timestamp_response_preserves_instant_and_precision(timestamp):
    """Naive database values mean UTC; aware values are converted rather than relabelled."""
    record = SimpleNamespace(timestamp=timestamp)
    assert UTCDateTime().serialize('timestamp', record) == '2026-11-19T06:30:00.123456+00:00'
    assert record.timestamp is timestamp


@pytest.mark.parametrize(('schema', 'field_name'), [
    (AccountUserSchema, 'last_login_at'),
    (ActivityLogSchema, 'activity_at'),
    (InvitationSchema, 'expiry_date'),
    (InvitationSchema, 'created_date'),
    (ItemSchema, 'submitted_on'),
    (ItemSubmissionSchema, 'created_date'),
    (StaffItemSchema, 'review_start_date'),
    (PackageSchema, 'submitted_on'),
    (PackageSchema, 'completed_on'),
    (PackageUpdateRequestSchema, 'created_date'),
    (PackageUpdateRequestSchema, 'note_updated_at'),
    (SubmittedDocumentSchema, 'created_date'),
    (SubmissionSchema, 'created_date'),
    (SubmissionItemNote, 'created_date'),
    (SubmissionReviewEntrySchema, 'created_date'),
    (SubmissionReviewEntrySchema, 'updated_date'),
])
def test_response_schemas_emit_explicit_utc(schema, field_name):
    """The timestamp fields used by existing user flows expose an explicit UTC offset."""
    field = schema().fields[field_name]
    timestamp = datetime(2026, 11, 19, 6, 30)
    assert isinstance(field, UTCDateTime)
    assert field.serialize(field_name, {field_name: timestamp}) == '2026-11-19T06:30:00+00:00'


def test_invitation_response_can_be_parsed_without_changing_expiry():
    """Expiration remains the same instant when a naive database row is serialized."""
    expiry = datetime(2026, 11, 20, 6, 30)
    result = InvitationSchema(only=('expiry_date',)).dump({'expiry_date': expiry})
    assert datetime.fromisoformat(result['expiry_date']) == expiry.replace(tzinfo=UTC)


def test_null_and_missing_timestamps():
    """Nullable response fields retain their existing null/missing behavior."""
    schema = PackageUpdateRequestSchema(only=('note_updated_at',))
    assert schema.dump({'note_updated_at': None}) == {'note_updated_at': None}
    assert schema.dump({}) == {}


def test_calendar_dates_and_request_parsing_are_unchanged():
    """Date Received stays a date and decision timestamp inputs retain their existing parser."""
    received = date(2026, 11, 19)
    field = SubmissionSchema().fields['received_date']
    assert field.serialize('received_date', {'received_date': received}) == '2026-11-19'
    assert field.deserialize('2026-11-19') == received
    value = '2026-11-19T11:30:00+05:00'
    request_field = PostPackageState().fields['decision_date']
    assert request_field.deserialize(value) == fields.DateTime().deserialize(value)
    assert UTCDateTime().deserialize(value) == fields.DateTime().deserialize(value)


def test_swagger_still_documents_timestamp_fields():
    """The response field subclass remains visible to the API model mapper."""
    model = Api.convert_ma_schema_to_restx_model(
        Namespace('timestamps'), SubmittedDocumentSchema(only=('created_date',)), 'Timestamp'
    )
    assert isinstance(model['created_date'], restx_fields.DateTime)


def test_access_history_normalizes_responses_without_changing_role_timestamps():
    """The history endpoint's manually built response follows the same UTC contract."""
    start = datetime(2026, 11, 19, 6, 30)
    end = datetime(2026, 11, 19, 11, 30, tzinfo=timezone(timedelta(hours=5)))
    role = SimpleNamespace(
        id=1, account_project_id=None, original_package_ids=[], active=False,
        role=SimpleNamespace(role_name='admin'), access_start=start, access_end=end,
    )
    module = 'submit_api.services.account_user_service'
    with patch(f'{module}.AccountUserModel.get_users_by_account_user_id', return_value=object()), \
            patch(f'{module}.UserRoleModel.get_access_history_by_account_user_id', return_value=[role]), \
            patch(f'{module}.AccountProjectModel.get_all_in_ids', return_value=[]), \
            patch.object(AccountUserService, '_fetch_package_names', return_value={}):
        history = AccountUserService.get_access_history(1)
    assert history[0]['access_start'] == '2026-11-19T06:30:00+00:00'
    assert history[0]['access_end'] == '2026-11-19T06:30:00+00:00'
    assert role.access_start is start
    assert role.access_end is end
