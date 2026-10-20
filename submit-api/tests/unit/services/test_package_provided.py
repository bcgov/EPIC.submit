"""Tests for completing management plans provided without a review decision."""
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from submit_api.enums.item_status import ItemStatus
from submit_api.exceptions import BadRequestError
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.package import Package, PackageStatus
from submit_api.models.queries.package import PackageItemQueries
from submit_api.services.package_service import PackageService


@pytest.mark.parametrize('purpose, expected', [('N/A', True), ('Review', False), ('', False), (None, False)])
def test_provided_plan_requires_explicit_na(purpose, expected):
    """Only the explicit N/A purpose selects the Provided flow."""
    package = SimpleNamespace(
        type=SimpleNamespace(name='Management Plan'),
        meta=SimpleNamespace(json={'main_condition': {'condition_attributes': {'submitted_to_eao_for': purpose}}}),
    )
    assert Package.is_provided_plan.fget(package) is expected
    package.type.name = 'IEM'
    assert Package.is_provided_plan.fget(package) is False


@pytest.fixture
def provided_package():
    """Return a submitted plan with consultation records and an older version."""
    return SimpleNamespace(
        id=2, is_provided_plan=True, submitted_on='2026-10-19', completed_on=None,
        status=[PackageStatus.SUBMITTED.value], enforceable=False, update_requests=[],
        version=SimpleNamespace(original_package_id=1, version=2),
        items=[SimpleNamespace(type=SimpleNamespace(name=name), status=ItemStatus.SUBMITTED)
               for name in (SubmissionItemType.MANAGEMENT_PLAN_FORM.value,
                            SubmissionItemType.CONSULTATION_RECORD.value)],
    )


def test_mark_as_provided_completes_and_enforces_current_version(provided_package):
    """Completion updates both reviewable items and replaces the enforceable version."""
    previous_package = SimpleNamespace(id=1, enforceable=True)
    versions = [SimpleNamespace(package=previous_package), SimpleNamespace(package=provided_package)]
    with (
        patch('submit_api.services.package_service.session_scope'),
        patch.object(PackageService, 'get_package_by_id', return_value=provided_package),
        patch('submit_api.services.package_service.PackageVersionModel.get_all_by_original_package_id',
              return_value=versions),
        patch('submit_api.services.package_service.PackageVersionService.deactivate_update_requests') as close_requests,
        patch('submit_api.services.package_service.ActivityLogService.log_activity') as log_activity,
    ):
        result = PackageService.update_package_state(2, {'status': 'PROVIDED'})

    assert result.completed_on is not None
    assert result.status == ['PROVIDED']
    assert result.enforceable is True
    assert previous_package.enforceable is False
    assert all(item.status == ItemStatus.PROVIDED for item in result.items)
    close_requests.assert_called_once()
    assert log_activity.call_args.kwargs['action'] == 'MP Provided'


@pytest.mark.parametrize('change', [
    {'is_provided_plan': False}, {'submitted_on': None},
    {'completed_on': '2026-10-19'}, {'status': [PackageStatus.WITHDRAWN]},
])
def test_mark_as_provided_rejects_ineligible_packages(provided_package, change):
    """Other purposes, drafts, completed plans and withdrawn plans cannot be marked."""
    for name, value in change.items():
        setattr(provided_package, name, value)
    with patch('submit_api.services.package_service.session_scope'), \
            patch.object(PackageService, 'get_package_by_id', return_value=provided_package):
        with pytest.raises(BadRequestError):
            PackageService.update_package_state(2, {'status': 'PROVIDED'})


def test_provided_status_takes_precedence_over_other_item_statuses():
    """Submitted contact information must not mask the package's final status."""
    items = [Mock(status=ItemStatus.SUBMITTED), Mock(status=ItemStatus.PROVIDED)]
    assert PackageItemQueries.aggregate_item_statuses(items) == ['PROVIDED']


def test_provided_status_sorts_before_update_overlays():
    """Keep the terminal badge ahead of the release's update badges."""
    assert PackageService._sort_statuses(['UPDATED', 'PROVIDED']) == ['PROVIDED', 'UPDATED']
