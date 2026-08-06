"""Unit tests for canonical D9 status ordering in PackageService._sort_statuses."""
from submit_api.services.package_service import PackageService


class TestCanonicalStatusOrdering:
    """Tests for D9 canonical status ordering."""

    def test_overlays_always_sort_last(self):
        """Update Requested, Revision Required, Updated always come after primary statuses."""
        statuses = ['UPDATE_REQUESTED', 'SUBMITTED', 'UNDER_REVIEW']
        result = PackageService._sort_statuses(statuses)
        assert result == ['SUBMITTED', 'UNDER_REVIEW', 'UPDATE_REQUESTED']

    def test_review_stream_order_preserved(self):
        """Under CC, Passed CC, Under Review, Awaiting Manager Approval in correct order."""
        statuses = [
            'AWAITING_MANAGER_APPROVAL', 'UNDER_REVIEW',
            'PASSED_CONSULTATION_CHECK', 'UNDER_CONSULTATION_CHECK'
        ]
        result = PackageService._sort_statuses(statuses)
        assert result == [
            'UNDER_CONSULTATION_CHECK', 'PASSED_CONSULTATION_CHECK',
            'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL'
        ]

    def test_passed_cc_never_before_under_cc(self):
        """Passed Consultation Check never sorts before Under Consultation Check."""
        statuses = ['PASSED_CONSULTATION_CHECK', 'UNDER_CONSULTATION_CHECK']
        result = PackageService._sort_statuses(statuses)
        under_idx = result.index('UNDER_CONSULTATION_CHECK')
        passed_idx = result.index('PASSED_CONSULTATION_CHECK')
        assert under_idx < passed_idx

    def test_primary_status_before_review_stream(self):
        """Primary status (Submitted) comes before review stream statuses."""
        statuses = ['UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL', 'SUBMITTED']
        result = PackageService._sort_statuses(statuses)
        assert result[0] == 'SUBMITTED'

    def test_multiple_overlays_maintain_internal_order(self):
        """Multiple overlays maintain their canonical internal order."""
        statuses = ['UPDATED', 'REVISION_REQUIRED', 'UPDATE_REQUESTED', 'SUBMITTED']
        result = PackageService._sort_statuses(statuses)
        assert result == ['SUBMITTED', 'UPDATE_REQUESTED', 'REVISION_REQUIRED', 'UPDATED']

    def test_single_status_unchanged(self):
        """A single status is returned as-is."""
        assert PackageService._sort_statuses(['IN_PROGRESS']) == ['IN_PROGRESS']

    def test_empty_list_unchanged(self):
        """An empty list is returned as-is."""
        assert PackageService._sort_statuses([]) == []

    def test_unknown_status_goes_to_end(self):
        """Statuses not in the canonical order go to the end."""
        statuses = ['SOME_UNKNOWN', 'SUBMITTED', 'UNDER_REVIEW']
        result = PackageService._sort_statuses(statuses)
        assert result[-1] == 'SOME_UNKNOWN'
        assert result[0] == 'SUBMITTED'

    def test_full_example_with_all_groups(self):
        """Full example with primary, review stream, and overlay statuses."""
        statuses = [
            'REVISION_REQUESTED', 'UNDER_CONSULTATION_CHECK',
            'SUBMITTED', 'UNDER_REVIEW', 'UPDATED'
        ]
        result = PackageService._sort_statuses(statuses)
        assert result == [
            'SUBMITTED', 'UNDER_CONSULTATION_CHECK',
            'UNDER_REVIEW', 'REVISION_REQUESTED', 'UPDATED'
        ]
