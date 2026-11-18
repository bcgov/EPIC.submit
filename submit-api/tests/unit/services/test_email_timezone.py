"""BC email dates use Vancouver's time conversion and the PCT label."""
from datetime import UTC, datetime, timedelta, timezone

from flask import Flask
import pytest

from submit_api.services.email_queue_service import SubmitEmailQueueService


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
    ('2026-01-15T14:38:00+00:00', '2026-01-15 06:38 AM PCT'),
    ('2026-03-08T09:59:00+00:00', '2026-03-08 01:59 AM PCT'),
    ('2026-03-08T10:00:00+00:00', '2026-03-08 03:00 AM PCT'),
    ('2026-03-09T06:59:00+00:00', '2026-03-08 11:59 PM PCT'),
    ('2026-03-09T07:00:00+00:00', '2026-03-09 12:00 AM PCT'),
    ('2026-11-01T09:00:00+00:00', '2026-11-01 02:00 AM PCT'),
    ('2026-11-18T14:38:32+00:00', '2026-11-18 07:38 AM PCT'),
    ('2027-01-15T14:38:00+00:00', '2027-01-15 07:38 AM PCT'),
])
def test_bc_email_dates(app_context, configured_timezone, utc_date, expected):
    """Defaults and existing Helm values use BC rules and always display PCT."""
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


def test_explicit_non_bc_timezone(app_context):
    """An intentional timezone override retains its own abbreviation."""
    app_context.config['LEGISLATIVE_TIMEZONE'] = 'UTC'
    assert SubmitEmailQueueService._format_submission_date(
        datetime(2026, 11, 18, 14, 38, tzinfo=UTC)
    ) == '2026-11-18 02:38 PM UTC'


def test_missing_email_date(app_context):
    """Absent submission dates still render as an empty string."""
    assert SubmitEmailQueueService._format_submission_date(None) == ''
