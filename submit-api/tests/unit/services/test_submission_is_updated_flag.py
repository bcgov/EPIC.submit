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


class TestUpdateSubmissionStatusClearsIsUpdated:
    """Tests that verifying/acknowledging a document clears the is_updated badge flag."""

    @staticmethod
    def _patch_common(monkeypatch, submission, package):
        """Patch the collaborators used by update_submission_status."""
        from contextlib import contextmanager

        from submit_api.services import submission as submission_module

        @contextmanager
        def fake_session_scope():
            yield Mock()

        monkeypatch.setattr(submission_module, "session_scope", fake_session_scope)
        # Logger needs an app context; stub current_app so the no-op info() call is safe.
        monkeypatch.setattr(submission_module, "current_app", Mock())
        monkeypatch.setattr(
            SubmissionService, "get_submission_by_id", classmethod(lambda cls, _id: submission)
        )
        monkeypatch.setattr(
            SubmissionService, "get_package_by_submission_id", classmethod(lambda cls, _id: package)
        )
        # The package status is not ACKNOWLEDGED, so the status recompute branch runs;
        # stub it out so we only exercise the is_updated clearing logic.
        monkeypatch.setattr(
            submission_module.PackageSubmissionQueries,
            "update_package_status_from_submissions",
            Mock(),
        )

    @staticmethod
    def _make_submission(status):
        """Build a mock submission flagged as updated."""
        submission = Mock()
        submission.status = status
        submission.is_updated = True
        return submission

    @staticmethod
    def _make_package(approval_type):
        """Build a mock package with a configured approval type and non-ack status."""
        package = Mock()
        package.type.approval_type = approval_type
        package.type.versioning_enabled = True
        package.status = []
        return package

    def test_clears_is_updated_when_verified(self, monkeypatch):
        """Verifying a document before acknowledgement clears the badge flag."""
        from submit_api.enums.package_type import PackageApprovalType
        from submit_api.models.submission import SubmissionStatus

        submission = self._make_submission(SubmissionStatus.SUBMITTED)
        package = self._make_package(PackageApprovalType.B)
        self._patch_common(monkeypatch, submission, package)

        result = SubmissionService.update_submission_status(1, "VERIFIED")

        assert result.is_updated is False
        assert result.status == "VERIFIED"

    def test_does_not_clear_is_updated_on_undo_verification(self, monkeypatch):
        """Undoing verification (back to SUBMITTED) keeps the badge flag set."""
        from submit_api.enums.package_type import PackageApprovalType
        from submit_api.models.submission import SubmissionStatus

        submission = self._make_submission(SubmissionStatus.VERIFIED)
        package = self._make_package(PackageApprovalType.B)
        self._patch_common(monkeypatch, submission, package)

        result = SubmissionService.update_submission_status(1, "SUBMITTED")

        assert result.is_updated is True
        assert result.status == "SUBMITTED"
