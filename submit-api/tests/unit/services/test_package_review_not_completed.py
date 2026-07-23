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
        """Without a CC in progress, only actively-reviewed items are marked."""
        cr = _item(SubmissionItemType.CONSULTATION_RECORD.value, ItemStatus.PASSED_CONSULTATION_CHECK)
        mp = _item(SubmissionItemType.MANAGEMENT_PLAN_FORM.value, ItemStatus.UNDER_REVIEW)

        result = PackageService._get_items_to_mark_review_not_completed([cr, mp])

        assert result == [mp]

    def test_submitted_management_plan_not_marked_without_consultation_check(self):
        """A SUBMITTED MP is not marked when the package is not under consultation check."""
        contact = _item(SubmissionItemType.CONTACT_INFORMATION.value, ItemStatus.SUBMITTED)
        mp = _item(SubmissionItemType.MANAGEMENT_PLAN_FORM.value, ItemStatus.SUBMITTED)

        result = PackageService._get_items_to_mark_review_not_completed([contact, mp])

        assert result == []
