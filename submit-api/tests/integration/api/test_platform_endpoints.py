"""Integration tests for account, terms of service, activity log, ops, migration and document endpoints."""
from http import HTTPStatus
from unittest.mock import patch

from faker import Faker

from submit_api.enums.activity_type import ActivityTypeEnum, VisibilityTypeEnum
from submit_api.models import ActivityLog
from submit_api.models.account_terms_of_service import TermsOfService
from submit_api.models.submission import SubmissionStatus
from tests.utilities.factory_utils import (
    factory_account_model, factory_document_submission_model, factory_item_model, factory_package_model,
    setup_authenticated_proponent)


fake = Faker()
API = "/api"


# --------------------------------------------------------------------------- accounts
def test_get_account_by_proponent(session, client, auth_header):
    """An account is retrievable by proponent id."""
    proponent_id = fake.random_int(100000, 999999)
    account = factory_account_model(proponent_id=proponent_id)
    response = client.get(f"{API}/accounts/proponent/{proponent_id}", headers=auth_header)
    assert response.status_code == HTTPStatus.OK
    assert response.get_json()["id"] == account.id


def test_get_account_by_proponent_not_found(session, client, auth_header):
    """An unknown proponent returns 404."""
    response = client.get(f"{API}/accounts/proponent/99999999", headers=auth_header)
    assert response.status_code == HTTPStatus.NOT_FOUND


def test_create_account_duplicate_proponent(session, client, auth_header):
    """A second account for the same proponent is a conflict."""
    proponent_id = fake.random_int(100000, 999999)
    factory_account_model(proponent_id=proponent_id)
    response = client.post(f"{API}/accounts", json={"proponent_id": proponent_id}, headers=auth_header)
    assert response.status_code == HTTPStatus.CONFLICT


def test_account_service_update_and_delete(session):
    """Account update and delete helpers operate on existing accounts."""
    from submit_api.services.account_service import AccountService

    account = factory_account_model(proponent_id=fake.random_int(100000, 999999))
    assert AccountService.get_account_by_id(account.id).id == account.id
    assert AccountService.delete_account(99999999) is None
    assert AccountService.delete_account(account.id).id == account.id


def test_get_account_packages(session, client, jwt):
    """A proponent can list the packages of their account."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    package = factory_package_model(account_project=account_project)
    response = client.get(f"{API}/accounts/{account_project.account_id}/packages", headers=headers)
    assert response.status_code == HTTPStatus.OK
    package_ids = [p["id"] for project in response.get_json() for p in project["packages"]]
    assert package.id in package_ids


def test_get_account_packages_unknown_user(session, client, jwt):
    """A caller without a user record is told the user was not found."""
    import copy
    from tests.utilities.factory_scenarios import TestJwtClaims
    from tests.utilities.factory_utils import factory_auth_header

    claims = copy.deepcopy(dict(TestJwtClaims.staff_admin_role))
    claims["preferred_username"] = f"ghost-{fake.uuid4()}"
    response = client.get(f"{API}/accounts/1/packages", headers=factory_auth_header(jwt, claims))
    assert response.status_code in (HTTPStatus.NOT_FOUND, HTTPStatus.UNAUTHORIZED)


# --------------------------------------------------------------------------- terms of service
def test_terms_of_service_lifecycle(session, client, auth_header):
    """Creating a terms of service deactivates the previous one."""
    first = client.post(f"{API}/terms-of-service", json={"version": 9001, "content": "v1"}, headers=auth_header)
    second = client.post(f"{API}/terms-of-service", json={"version": 9002, "content": "v2"}, headers=auth_header)
    active = client.get(f"{API}/terms-of-service", headers=auth_header)

    assert first.status_code == HTTPStatus.CREATED
    assert second.status_code == HTTPStatus.CREATED
    assert active.status_code == HTTPStatus.OK
    assert active.get_json()["version"] == 9002
    assert TermsOfService.get_active_terms_of_service_by_version(9001) is None


def test_terms_of_service_not_found_when_none_active(session, client, auth_header):
    """With no active terms the API returns 404."""
    session.query(TermsOfService).update({"active": False})
    session.flush()
    assert client.get(f"{API}/terms-of-service", headers=auth_header).status_code == HTTPStatus.NOT_FOUND


# --------------------------------------------------------------------------- activity logs
def _log(session, visibility, entity_id):
    log = ActivityLog(
        entity_type=ActivityTypeEnum.PACKAGE.value, entity_id=entity_id, action="Did a thing",
        actor_id="someone", actor_type="staff", visibility=visibility)
    session.add(log)
    session.flush()
    return log


def test_activity_logs_for_staff_include_all(session, client, auth_header):
    """Staff see staff and public log entries."""
    entity_id = fake.random_int(100000, 999999)
    _log(session, VisibilityTypeEnum.STAFF.value, entity_id)
    _log(session, VisibilityTypeEnum.PUBLIC.value, entity_id)
    response = client.get(f"{API}/activity-logs/{ActivityTypeEnum.PACKAGE.value}/{entity_id}", headers=auth_header)
    assert response.status_code == HTTPStatus.OK
    assert len(response.get_json()) == 2


def test_activity_log_service_filters_public(session):
    """Only public entries are returned when not requested for staff."""
    from submit_api.services.activity_log_service import ActivityLogService

    entity_id = fake.random_int(100000, 999999)
    _log(session, VisibilityTypeEnum.STAFF.value, entity_id)
    public = _log(session, VisibilityTypeEnum.PUBLIC.value, entity_id)
    logs = ActivityLogService.get_activity_logs(ActivityTypeEnum.PACKAGE.value, entity_id, for_staff=False)
    assert [entry.id for entry in logs] == [public.id]
    assert logs[0].to_dict()["action"] == "Did a thing"


def test_activity_log_service_log_activity_with_session(session, creator):
    """log_activity adds an entry to the provided session."""
    from submit_api.services.activity_log_service import ActivityLogService

    entry = ActivityLogService.log_activity(entity_id=1, action="Created", actor_id=creator, session=session)
    assert entry.actor_id == creator


# --------------------------------------------------------------------------- ops
def test_healthz_and_readyz(session, client):
    """Health endpoints respond."""
    assert client.get("/ops/healthz").status_code == HTTPStatus.OK
    assert client.get("/ops/readyz").status_code == HTTPStatus.OK


def test_healthz_reports_database_failure(session, client):
    """A database failure is reported as 500."""
    from sqlalchemy.exc import SQLAlchemyError

    with patch("submit_api.resources.ops.db.session.execute", side_effect=SQLAlchemyError("down")):
        assert client.get("/ops/healthz").status_code == HTTPStatus.INTERNAL_SERVER_ERROR


# --------------------------------------------------------------------------- documents
def _document(session, creator, status=SubmissionStatus.SUBMITTED, account_project=None, name=None):
    package = factory_package_model(account_project=account_project)
    item = factory_item_model(package=package)
    submission = factory_document_submission_model(item, created_by=creator, status=status, name=name)
    submission.root_submission_id = submission.id
    session.flush()
    return package, item, submission


def test_staff_documents_listing_and_filters(session, client, auth_header, creator):
    """Staff can list and filter documents across projects."""
    package, _, submission = _document(session, creator, name="needle-report.pdf")
    url = f"{API}/documents"

    listing = client.get(f"{url}?name=needle", headers=auth_header)
    assert listing.status_code == HTTPStatus.OK
    body = listing.get_json()
    assert submission.submitted_document_id in [i["id"] for i in body["items"]]
    assert body["page"] == 1

    for query in (
        "status=SUBMITTED", "submission_type=Management Plan",
        "work_phase=Management Plan & Related Documents - Post Decision",
        "work_phase=Other - Phase", "submitted_on_start=2000-01-01", "submitted_on_end=2999-01-01",
        "search_text=needle",
    ):
        assert client.get(f"{url}?{query}", headers=auth_header).status_code == HTTPStatus.OK


def test_proponent_documents_requires_project_id(session, client, jwt):
    """Proponents must supply a project id."""
    headers, _ = setup_authenticated_proponent(session, jwt)
    assert client.get(f"{API}/documents", headers=headers).status_code == HTTPStatus.BAD_REQUEST


def test_proponent_documents_for_project(session, client, jwt, creator):
    """Proponents see documents of their own project."""
    headers, account_project = setup_authenticated_proponent(session, jwt)
    _, _, submission = _document(session, creator, account_project=account_project)
    response = client.get(f"{API}/documents?project_id={account_project.project_id}", headers=headers)
    assert response.status_code == HTTPStatus.OK
    assert submission.submitted_document_id in [i["id"] for i in response.get_json()["items"]]


def test_documents_unauthorized(client):
    """A missing token is rejected."""
    assert client.get(f"{API}/documents").status_code == HTTPStatus.UNAUTHORIZED


def test_failed_documents_by_item(session, client, auth_header, creator):
    """Rejected documents of an item are returned."""
    _, item, submission = _document(session, creator, status=SubmissionStatus.REJECTED)
    response = client.get(f"{API}/documents/failed/items/{item.id}", headers=auth_header)
    assert response.status_code == HTTPStatus.OK
    assert [s["id"] for s in response.get_json()] == [submission.id]


def test_submissions_by_package(session, client, auth_header, creator):
    """Non-pending document submissions of a package are returned."""
    package, _, submission = _document(session, creator)
    response = client.get(f"{API}/documents/submissions/packages/{package.id}", headers=auth_header)
    assert response.status_code == HTTPStatus.OK
    assert [s["id"] for s in response.get_json()] == [submission.id]


def test_document_service_helpers(session, creator):
    """Service helpers delegate to the document queries."""
    from submit_api.models.account_project_search_options import DocumentSearchOptions, ProjectDocumentSearchOptions
    from submit_api.services.submitted_document_service import DocumentService

    _document(session, creator)
    assert DocumentService.get_all_documents() is not None
    assert DocumentService.get_all_documents(DocumentSearchOptions(search_text="zzz-none")) == []
    options = ProjectDocumentSearchOptions(page=1, size=10, is_staff=True)
    assert DocumentService.get_project_documents_paginated(options).total >= 1
