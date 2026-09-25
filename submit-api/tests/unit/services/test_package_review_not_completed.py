"""Unit tests for selecting items to mark REVIEW_NOT_COMPLETED on new package version."""
from unittest.mock import Mock

from submit_api.enums.item_status import ItemStatus
from submit_api.models.item_type import SubmissionItemType
from submit_api.services.package_service import PackageService


def _item(item_type_name, status):
    """Build a mock item with the given type name and status."""
    item = Mock()
    item.status = status
    item.type = Mock()
    item.type.name = item_type_name
    return item


class TestGetItemsToMarkReviewNotCompleted:
    """Tests for PackageService._get_items_to_mark_review_not_completed."""

    def test_under_consultation_check_includes_submitted_management_plan(self):
        """MP still SUBMITTED during CC is marked when a new version is created."""
        contact = _item(SubmissionItemType.CONTACT_INFORMATION.value, ItemStatus.SUBMITTED)
        cr = _item(SubmissionItemType.CONSULTATION_RECORD.value, ItemStatus.UNDER_CONSULTATION_CHECK)
        mp = _item(SubmissionItemType.MANAGEMENT_PLAN_FORM.value, ItemStatus.SUBMITTED)

        result = PackageService._get_items_to_mark_review_not_completed([contact, cr, mp])

        assert cr in result
        assert mp in result
        # Contact information is SUBMITTED but not a reviewable section - must be left alone.
        assert contact not in result

    def test_under_review_includes_active_items_only(self):
        """Actively-reviewed items are marked, terminal-outcome items are left alone."""
        cr = _item(SubmissionItemType.CONSULTATION_RECORD.value, ItemStatus.PASSED_CONSULTATION_CHECK)
        mp = _item(SubmissionItemType.MANAGEMENT_PLAN_FORM.value, ItemStatus.UNDER_REVIEW)

        result = PackageService._get_items_to_mark_review_not_completed([cr, mp])

        assert result == [mp]

    def test_submitted_reviewable_sections_marked_before_review_starts(self):
        """SUBMITTED CR and MP are marked even when no review has started yet.

        This is the case where EAO creates a new package before the CC/MP review
        begins, so the superseded reviewable sections should not keep a stale
        "Submitted" badge.
        """
        contact = _item(SubmissionItemType.CONTACT_INFORMATION.value, ItemStatus.SUBMITTED)
        cr = _item(SubmissionItemType.CONSULTATION_RECORD.value, ItemStatus.SUBMITTED)
        mp = _item(SubmissionItemType.MANAGEMENT_PLAN_FORM.value, ItemStatus.SUBMITTED)

        result = PackageService._get_items_to_mark_review_not_completed([contact, cr, mp])

        assert cr in result
        assert mp in result
        # Contact information is not a reviewable section - must be left alone.
        assert contact not in result

    def test_resubmitted_management_plan_marked_before_review_starts(self):
        """A resubmitted MP (SUBMITTED again) is marked when superseded before review."""
        mp = _item(SubmissionItemType.MANAGEMENT_PLAN_FORM.value, ItemStatus.SUBMITTED)

        result = PackageService._get_items_to_mark_review_not_completed([mp])

        assert result == [mp]

    def test_contact_information_never_marked(self):
        """Contact information is never flagged regardless of status."""
        contact = _item(SubmissionItemType.CONTACT_INFORMATION.value, ItemStatus.SUBMITTED)

        result = PackageService._get_items_to_mark_review_not_completed([contact])

        assert result == []

    def test_terminal_status_items_not_marked(self):
        """Items already in a terminal review state are not re-flagged."""
        cr = _item(SubmissionItemType.CONSULTATION_RECORD.value, ItemStatus.APPROVED)
        mp = _item(SubmissionItemType.MANAGEMENT_PLAN_FORM.value, ItemStatus.REVIEW_REJECTED)

        result = PackageService._get_items_to_mark_review_not_completed([cr, mp])

        assert result == []
