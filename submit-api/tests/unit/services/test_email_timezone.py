"""BC email dates use UTC-07:00 year-round and the PCT label."""
from datetime import UTC, date, datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

from flask import Flask
import pytest

from submit_api.services.email_queue_service import SubmitEmailQueueService
from submit_api.services.submission import SubmissionService
from submit_api.utils.constants import MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE


@pytest.fixture(scope='session', autouse=True)
def cleanup_database():
    """These formatting tests do not use the database."""
    yield


@pytest.fixture(autouse=True)
def app_context():
    """Use a minimal Flask context without the database-backed app fixture."""
    app = Flask(__name__)
    with app.app_context():
        yield app


@pytest.mark.parametrize('configured_timezone', [None, '', 'US/Pacific', 'America/Vancouver'])
@pytest.mark.parametrize(('utc_date', 'expected'), [
    ('2026-11-01T09:00:00+00:00', '2026-11-01 02:00 AM PCT'),
    ('2026-11-18T14:38:32+00:00', '2026-11-18 07:38 AM PCT'),
    ('2026-11-19T06:59:00+00:00', '2026-11-18 11:59 PM PCT'),
    ('2026-11-19T07:00:00+00:00', '2026-11-19 12:00 AM PCT'),
    ('2027-01-15T14:38:00+00:00', '2027-01-15 07:38 AM PCT'),
    ('2027-07-15T14:38:00+00:00', '2027-07-15 07:38 AM PCT'),
])
def test_bc_email_dates(app_context, configured_timezone, utc_date, expected):
    """Emails show BC time regardless of missing or existing Helm timezone values."""
    if configured_timezone is not None:
        app_context.config['LEGISLATIVE_TIMEZONE'] = configured_timezone

    assert SubmitEmailQueueService._format_submission_date(datetime.fromisoformat(utc_date)) == expected


def test_naive_email_date_is_utc(app_context):
    """Database timestamps without timezone information are interpreted as UTC."""
    assert SubmitEmailQueueService._format_submission_date(
        datetime(2026, 11, 18, 14, 38)
    ) == '2026-11-18 07:38 AM PCT'


def test_aware_email_date_preserves_instant(app_context):
    """An explicit input offset is respected before converting to BC time."""
    assert SubmitEmailQueueService._format_submission_date(
        datetime(2026, 11, 18, 19, 38, tzinfo=timezone(timedelta(hours=5)))
    ) == '2026-11-18 07:38 AM PCT'


def test_missing_email_date(app_context):
    """Absent submission dates still render as an empty string."""
    assert SubmitEmailQueueService._format_submission_date(None) == ''


@pytest.mark.parametrize(('utc_date', 'expected_date'), [
    (datetime(2026, 11, 19, 6, 59), '2026-11-18'),
    (datetime(2026, 11, 19, 7), '2026-11-19'),
    (datetime(2026, 11, 19, 6, 59, tzinfo=UTC), '2026-11-18'),
])
def test_staff_subject_matches_body_date(app_context, utc_date, expected_date):
    """Subject and body use the same BC calendar date near midnight."""
    app_context.config['STAFF_SUPPORT_MAIL_ID'] = 'staff@example.com'
    project = SimpleNamespace(name='Example project', proponent=SimpleNamespace(name='Example holder'))
    package = SimpleNamespace(name='Example package', submitted_on=utc_date, account_project_id=1, items=[])
    service = SubmitEmailQueueService
    with patch.object(service, '_get_submitter', return_value=SimpleNamespace(full_name='Example user')), \
            patch.object(service, '_get_sender_email', return_value='sender@example.com'), \
            patch.object(service, '_get_account_project', return_value=SimpleNamespace(project=project)):
        payload = service._build_package_submission_payload(
            package, MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE
        )

    assert payload['subject'] == f'SUBMISSION - Example project - Example package - {expected_date}'
    assert payload['body_args']['submission_date'].startswith(expected_date)


@pytest.mark.parametrize(('utc_now', 'expected_date'), [
    (datetime(2026, 11, 19, 6, 59, tzinfo=UTC), date(2026, 11, 18)),
    (datetime(2026, 11, 19, 7, tzinfo=UTC), date(2026, 11, 19)),
    (datetime(2026, 11, 19, 7, 30, tzinfo=UTC), date(2026, 11, 19)),
])
def test_local_today_uses_bc_date(app_context, utc_now, expected_date):
    """Received-date validation uses BC midnight despite old US/Pacific settings."""
    app_context.config['LEGISLATIVE_TIMEZONE'] = 'US/Pacific'
    with patch('submit_api.services.submission.datetime') as clock:
        clock.now.side_effect = lambda tz: utc_now.astimezone(tz)
        assert SubmissionService._local_today() == expected_date
