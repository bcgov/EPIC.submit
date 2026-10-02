"""Unit tests for SubmissionService._should_flag_is_updated.

Covers which update windows cause a submission to be flagged as updated
(and therefore eligible for the New Version / New Document badges):

1. The current package is already submitted (submitted_on set) — IPD before ack.
2. The package is a revision version (version >= 2) created for an update
   request / resubmission, not yet submitted.
"""
from unittest.mock import Mock

from submit_api.services.submission import SubmissionService


def _make_item(submitted_on=None, version_number=None):
    """Build a mock item whose package reflects the given state."""
    item = Mock()
    package = Mock()
    package.submitted_on = submitted_on
    if version_number is None:
        package.version = None
    else:
        package.version = Mock()
        package.version.version = version_number
    item.package = package
    return item


class TestShouldFlagIsUpdated:
    """Tests for the is_updated flagging decision."""

    def test_flags_when_package_already_submitted(self):
        """A change on an already-submitted package (IPD before ack) is flagged."""
        item = _make_item(submitted_on="2026-01-01T00:00:00Z", version_number=1)
        assert SubmissionService._should_flag_is_updated(item) is True

    def test_flags_on_revision_version_not_yet_submitted(self):
        """A change on an unsubmitted revision package (version >= 2) is flagged."""
        item = _make_item(submitted_on=None, version_number=2)
        assert SubmissionService._should_flag_is_updated(item) is True

    def test_does_not_flag_first_version_before_submission(self):
        """A change on a first-version package not yet submitted is not flagged."""
        item = _make_item(submitted_on=None, version_number=1)
        assert SubmissionService._should_flag_is_updated(item) is False

    def test_does_not_flag_first_version_without_version_record(self):
        """A first submission with no version record is not flagged."""
        item = _make_item(submitted_on=None, version_number=None)
        assert SubmissionService._should_flag_is_updated(item) is False

    def test_does_not_flag_when_item_is_none(self):
        """A missing item is not flagged (defensive guard)."""
        assert SubmissionService._should_flag_is_updated(None) is False

    def test_does_not_flag_when_package_is_none(self):
        """An item without a package is not flagged (defensive guard)."""
        item = Mock()
        item.package = None
        assert SubmissionService._should_flag_is_updated(item) is False
