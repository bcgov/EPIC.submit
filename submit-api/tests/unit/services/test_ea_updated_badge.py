"""EA badge lifecycle, section acceptance and withdrawal eligibility regressions."""
from contextlib import contextmanager
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from submit_api.enums.item_status import ItemStatus
from submit_api.enums.package_type import PackageApprovalType
from submit_api.exceptions import BadRequestError
from submit_api.models import Item as ItemModel
from submit_api.models.package import PackageStatus
from submit_api.models.submission import SubmissionStatus, SubmissionType
from submit_api.models.update_request import UpdateRequestType
from submit_api.models.user import UserType
from submit_api.schemas.package import PackageSchema
from submit_api.services.package_service import PackageService
from submit_api.services.submission import SubmissionService


def _package(name='IPD', statuses=None):
    return SimpleNamespace(
        id=1, type=SimpleNamespace(name=name, versioning_enabled=True, approval_type=PackageApprovalType.C),
        status=statuses or [PackageStatus.SUBMITTED], submitted_on='2026-11-01',
        version=SimpleNamespace(version=2), items=[], update_requests=[],
    )


@pytest.mark.parametrize('name', ['IPD', 'DPD'])
@pytest.mark.parametrize('audience', [UserType.STAFF, UserType.PROPONENT])
def test_open_ea_request_takes_priority_until_proponent_resubmits(name, audience):
    """Pre-existing unverified changes cannot hide a newly sent request."""
    package = _package(name)
    document = SimpleNamespace(is_updated=True, status=SubmissionStatus.SUBMITTED)
    package.items = [SimpleNamespace(status=ItemStatus.SUBMITTED, submissions=[document])]
    request = SimpleNamespace(active=True, status='OPEN', type=UpdateRequestType.UPDATE)
    package.update_requests = [request]
    statuses = PackageService.calculate_package_statuses(package, audience)
    assert 'UPDATE_REQUESTED' in statuses
    assert 'UPDATED' not in statuses
    assert document.is_updated
    request.status = 'PENDING_REVIEW'
    statuses = PackageService.calculate_package_statuses(package, audience)
    assert 'UPDATED' in statuses
    assert 'UPDATE_REQUESTED' not in statuses


@pytest.mark.parametrize('name', ['Management Plan', 'IEM'])
def test_non_ea_priority_is_unchanged(name):
    """Management Plan and IEM retain their existing overlay priority."""
    package = _package(name)
    package.items = [SimpleNamespace(status=ItemStatus.SUBMITTED, submissions=[
        SimpleNamespace(is_updated=True, status=SubmissionStatus.SUBMITTED),
    ])]
    package.update_requests = [SimpleNamespace(active=True, status='OPEN', type=UpdateRequestType.UPDATE)]
    assert 'UPDATED' in PackageService.calculate_package_statuses(package, UserType.STAFF)
    assert 'UPDATE_REQUESTED' not in PackageService.calculate_package_statuses(package, UserType.STAFF)


@pytest.fixture
def flag_session():
    """Minimal isolated tables execute the production bulk update without app migrations."""
    engine = create_engine('sqlite://')
    with Session(engine) as session:
        session.execute(text('CREATE TABLE items (id INTEGER PRIMARY KEY, package_id INTEGER, type_id INTEGER)'))
        session.execute(text('CREATE TABLE submissions (id INTEGER PRIMARY KEY, item_id INTEGER, '
                             'is_updated BOOLEAN, updated_date DATETIME, updated_by TEXT)'))
        session.execute(text('INSERT INTO items VALUES (1,1,10), (2,1,20), (3,1,30), (4,2,10)'))
        session.execute(text('INSERT INTO submissions (id,item_id,is_updated) VALUES '
                             '(1,1,1), (2,2,1), (3,3,1), (4,4,1)'))
        yield session
    engine.dispose()


@pytest.mark.parametrize('name', ['IPD', 'DPD'])
def test_accept_update_clears_only_named_sections(name, flag_session):
    """Unrequested sections and other packages retain their badges."""
    package = _package(name)
    PackageService._reset_is_updated_for_accepted_request(
        package, SimpleNamespace(submission_item_types=[10, 20]), flag_session,
    )
    flags = dict(flag_session.execute(text('SELECT id, is_updated FROM submissions')).all())
    assert flags == {1: 0, 2: 0, 3: 1, 4: 1}
    remaining_document = SimpleNamespace(is_updated=bool(flags[3]), status=SubmissionStatus.SUBMITTED)
    package.items = [SimpleNamespace(status=ItemStatus.SUBMITTED, submissions=[remaining_document])]
    assert 'UPDATED' in PackageService.calculate_package_statuses(package, UserType.STAFF)


@pytest.mark.parametrize('name', ['Management Plan', 'IEM'])
def test_non_ea_acceptance_still_includes_sections_without_requests(name, flag_session):
    """Retain accepted sections and the existing no-open-request expansion."""
    real_query = flag_session.query
    sections_without_requests = Mock()
    sections_without_requests.join.return_value.filter.return_value.distinct.return_value.all.return_value = [(20,)]

    def query(*entities):
        # PostgreSQL's unnest query is built normally; only its result set is stubbed.
        if entities[0] is ItemModel.type_id:
            return sections_without_requests
        return real_query(*entities)

    with patch.object(flag_session, 'query', side_effect=query):
        PackageService._reset_is_updated_for_accepted_request(
            _package(name), SimpleNamespace(submission_item_types=[10]), flag_session,
        )
    assert dict(flag_session.execute(text('SELECT id, is_updated FROM submissions')).all()) == {
        1: 0, 2: 0, 3: 1, 4: 1,
    }


@pytest.mark.parametrize('name', ['IPD', 'DPD'])
def test_acknowledgement_clears_remaining_ea_flags(name):
    """Acknowledging clears changed documents in all sections."""
    package = _package(name)
    documents = [
        SimpleNamespace(type=SubmissionType.DOCUMENT, is_updated=True, status=SubmissionStatus.SUBMITTED)
        for _ in range(2)
    ]
    package.items = [SimpleNamespace(status=ItemStatus.SUBMITTED, submissions=documents)]

    @contextmanager
    def session_scope():
        yield Mock()

    with patch('submit_api.services.package_service.session_scope', session_scope), \
            patch('submit_api.services.package_service.authorization.require_team_lead_access'), \
            patch('submit_api.services.package_service.SubmitEmailQueueService'), \
            patch.object(PackageService, 'get_package_by_id', return_value=package):
        PackageService.acknowledge_package(1)
    assert all(document.is_updated is False for document in documents)
    assert 'UPDATED' not in PackageService.calculate_package_statuses(package, UserType.STAFF)


@pytest.mark.parametrize('status', [
    PackageStatus.SUBMITTED, PackageStatus.INTERNAL_VERIFICATION, PackageStatus.VERIFIED,
    PackageStatus.READY_FOR_ACKNOWLEDGEMENT, PackageStatus.ACKNOWLEDGED, PackageStatus.READY_FOR_APPROVAL,
])
def test_withdrawal_eligibility_uses_underlying_status_despite_updated_overlay(status):
    """An Updated overlay cannot make a submitted/acknowledged Package 2 ineligible."""
    package = _package(statuses=[status, PackageStatus.UPDATED])
    assert PackageService.can_withdraw_package(package)
    assert PackageSchema().get_can_withdraw(package)
    PackageService._validate_package_for_withdrawal(package)


@pytest.mark.parametrize('statuses', [
    [PackageStatus.NEW], [PackageStatus.UPDATED], [PackageStatus.UPDATE_REQUESTED],
    [PackageStatus.APPROVED], [PackageStatus.NOT_APPROVED], [PackageStatus.ACCEPTED],
    [PackageStatus.WITHDRAWN], [PackageStatus.ACKNOWLEDGED, PackageStatus.APPROVED],
])
def test_invalid_withdrawal_is_disabled_by_the_api(statuses):
    """Expose false for every disallowed state rather than enabling a failing action."""
    package = _package(statuses=statuses)
    assert not PackageSchema().get_can_withdraw(package)
    with pytest.raises(BadRequestError):
        PackageService._validate_package_for_withdrawal(package)


@pytest.mark.parametrize('attribute,value', [('submitted_on', None), ('versioning_enabled', False)])
def test_unsubmitted_or_unversioned_package_cannot_be_withdrawn(attribute, value):
    """UI eligibility includes the endpoint's non-status prerequisites."""
    package = _package()
    setattr(package.type if attribute == 'versioning_enabled' else package, attribute, value)
    assert not PackageService.can_withdraw_package(package)


def test_verification_clears_only_after_last_document_and_undo_does_not_restore_badge():
    """Staff can verify across sessions; another resubmission makes Updated return."""
    package = _package()
    documents = [SimpleNamespace(is_updated=True, status=SubmissionStatus.SUBMITTED) for _ in range(2)]
    package.items = [SimpleNamespace(status=ItemStatus.SUBMITTED, submissions=documents)]

    @contextmanager
    def session_scope():
        yield Mock()

    with patch('submit_api.services.submission.session_scope', session_scope), \
            patch('submit_api.services.submission.current_app', Mock()), \
            patch.object(SubmissionService, 'get_package_by_submission_id', return_value=package), \
            patch('submit_api.services.submission.PackageSubmissionQueries.update_package_status_from_submissions'), \
            patch.object(SubmissionService, 'get_submission_by_id') as get_document:
        for index, document in enumerate(documents):
            get_document.return_value = document
            SubmissionService.update_submission_status(index + 1, 'VERIFIED')
            # A database read returns the enum value after a status write.
            document.status = SubmissionStatus(document.status)
            assert ('UPDATED' in PackageService.calculate_package_statuses(package, UserType.STAFF)) == (index == 0)
        SubmissionService.update_submission_status(2, 'SUBMITTED')
        documents[1].status = SubmissionStatus(documents[1].status)
        assert not documents[1].is_updated
        assert 'UPDATED' not in PackageService.calculate_package_statuses(package, UserType.STAFF)

        # The existing upload flagging rule starts the next review cycle.
        assert SubmissionService._should_flag_is_updated(SimpleNamespace(package=package))
        documents.append(SimpleNamespace(is_updated=True, status=SubmissionStatus.SUBMITTED))
        assert 'UPDATED' in PackageService.calculate_package_statuses(package, UserType.STAFF)


@pytest.fixture
def resubmit(monkeypatch):
    """Exercise request and document transitions with external side effects stubbed."""
    monkeypatch.setattr('submit_api.services.package_service.current_app', Mock())
    for method in ('_update_package_submission_details', '_create_email_queue_record', '_log_activity_submission'):
        monkeypatch.setattr(PackageService, method, Mock())
    return lambda package: PackageService._resubmit_package(package, Mock())


@pytest.mark.parametrize('name', ['IPD', 'DPD'])
@pytest.mark.parametrize('acknowledge', [True, False], ids=['pending-at-acknowledgement', 'empty-resubmission'])
def test_ea_request_waits_for_new_document(name, acknowledge, resubmit):
    """Only delivery of a new or replaced document answers the open request."""
    package = _package(name)
    package.completed_on = None
    package.account_project_work_id = None
    request = SimpleNamespace(active=True, status='OPEN', type=UpdateRequestType.UPDATE)
    package.update_requests = [request]
    old = SimpleNamespace(type=SubmissionType.DOCUMENT, status=SubmissionStatus.SUBMITTED,
                          is_updated=True, root_submission_id=1)
    replacement = SimpleNamespace(type=SubmissionType.DOCUMENT, status=SubmissionStatus.PENDING,
                                  is_updated=True, root_submission_id=1)
    item = SimpleNamespace(status=ItemStatus.SUBMITTED, submissions=[old], review=None)
    package.items = [item]

    if acknowledge:
        item.submissions.append(replacement)
        with patch('submit_api.services.package_service.session_scope'), \
                patch('submit_api.services.package_service.authorization.require_team_lead_access'), \
                patch('submit_api.services.package_service.SubmitEmailQueueService'), \
                patch.object(PackageService, 'get_package_by_id', return_value=package):
            PackageService.acknowledge_package(package.id)
        assert not old.is_updated
        assert replacement.is_updated
    else:
        resubmit(package)
        assert old.is_updated
        assert request.status == 'OPEN'
        statuses = PackageService.calculate_package_statuses(package, UserType.STAFF)
        assert 'UPDATE_REQUESTED' in statuses and 'UPDATED' not in statuses
        item.submissions.append(replacement)

    resubmit(package)
    assert request.status == 'PENDING_REVIEW'
    assert replacement.status == SubmissionStatus.SUBMITTED and replacement.is_updated
    statuses = PackageService.calculate_package_statuses(package, UserType.STAFF)
    assert 'UPDATED' in statuses and 'UPDATE_REQUESTED' not in statuses
