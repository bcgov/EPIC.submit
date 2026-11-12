"""Unit tests for the computed ``last_submitted_on`` field on PackageSchema.

``last_submitted_on`` surfaces the most recent document submission date for a
report obligation on the project card (Last Submitted column). It is computed
read-only from the package's document submissions: gather them, sort by
submission date descending, and take the first one's date formatted as
YYYY-MM-DD, or None when there are no documents.
"""
from datetime import date, datetime
from unittest.mock import Mock

from submit_api.models.submission import SubmissionType
from submit_api.schemas.package import PackageSchema


def _submission(submission_type, created_date):
    """Create a mock submission with a type and created_date."""
    submission = Mock()
    submission.type = submission_type
    submission.created_date = created_date
    return submission


def _item(submissions):
    """Create a mock item wrapping the given submissions."""
    item = Mock()
    item.submissions = submissions
    return item


def _package(items):
    """Create a mock package wrapping the given items."""
    package = Mock()
    package.items = items
    return package


class TestPackageLastSubmittedOn:
    """get_last_submitted_on derives the latest document submission date."""

    def test_returns_latest_document_date(self):
        """The most recent document submission date is returned (sort desc, first)."""
        package = _package([
            _item([
                _submission(SubmissionType.DOCUMENT, datetime(2026, 3, 30)),
                _submission(SubmissionType.DOCUMENT, datetime(2026, 9, 30)),
            ]),
            _item([
                _submission(SubmissionType.DOCUMENT, datetime(2026, 8, 20)),
            ]),
        ])

        result = PackageSchema().get_last_submitted_on(package)

        assert result == "2026-09-30"

    def test_returns_none_when_no_documents(self):
        """A package with no document submissions returns None."""
        package = _package([_item([])])

        result = PackageSchema().get_last_submitted_on(package)

        assert result is None

    def test_ignores_non_document_submissions(self):
        """Form submissions are ignored when computing the latest date."""
        package = _package([
            _item([
                _submission(SubmissionType.FORM, datetime(2026, 12, 1)),
                _submission(SubmissionType.DOCUMENT, datetime(2026, 1, 15)),
            ]),
        ])

        result = PackageSchema().get_last_submitted_on(package)

        assert result == "2026-01-15"

    def test_returns_none_when_no_items(self):
        """A package with no items returns None."""
        package = _package([])

        result = PackageSchema().get_last_submitted_on(package)

        assert result is None

    def test_eao_upload_counts_from_date_received(self):
        """An EAO-uploaded document counts from its date received, not its upload date."""
        eao_document = _submission(SubmissionType.DOCUMENT, datetime(2026, 11, 1))
        eao_document.received_date = date(2026, 10, 9)
        holder_document = _submission(SubmissionType.DOCUMENT, datetime(2026, 9, 30))
        holder_document.received_date = None
        package = _package([_item([eao_document, holder_document])])

        result = PackageSchema().get_last_submitted_on(package)

        assert result == "2026-10-09"

    def test_eao_upload_received_earlier_does_not_move_last_submitted_forward(self):
        """A document received before the latest holder submission leaves Last Submitted unchanged."""
        eao_document = _submission(SubmissionType.DOCUMENT, datetime(2026, 11, 1))
        eao_document.received_date = date(2026, 1, 2)
        holder_document = _submission(SubmissionType.DOCUMENT, datetime(2026, 9, 30))
        holder_document.received_date = None
        package = _package([_item([eao_document, holder_document])])

        result = PackageSchema().get_last_submitted_on(package)

        assert result == "2026-09-30"
