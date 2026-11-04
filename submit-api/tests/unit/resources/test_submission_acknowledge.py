"""Resource tests for the report document acknowledge endpoint.

POST /api/submissions/{id}/acknowledge acknowledges a verified Compliance
Self-Report (Report_TypeB) main report. Covers the success path and the
documented error codes (404 not found, 422 invalid state, 403 no access).
"""
from http import HTTPStatus
from unittest.mock import patch

from faker import Faker

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_auth_header,
    factory_document_submission_model,
    factory_item_model,
    factory_project_model,
    factory_project_report_model,
    factory_report_package_model,
    factory_user_model,
)
from submit_api.enums.package_type import PackageTypeEnum
from submit_api.models.package_type import PackageType
from submit_api.models.submission import SubmissionStatus
from submit_api.models.user import UserType

fake = Faker()

ACK_URL = "/api/submissions/{submission_id}/acknowledge"
EMAIL_TARGET = (
    "submit_api.services.submission.SubmitEmailQueueService."
    "queue_report_acknowledgement_email"
)


def _report_type_b_id():
    """Return the seeded Report_TypeB package type id."""
    package_type = PackageType.find_by_name(PackageTypeEnum.REPORT_TYPE_B.value)
    return package_type.id


def _setup_compliance_report_main_document(session, status=SubmissionStatus.VERIFIED):
    """Create a Report_TypeB package with a main report document in the given status."""
    auth_guid = TestJwtClaims.staff_admin_role["preferred_username"]
    factory_user_model(auth_guid=auth_guid)

    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    project_report = factory_project_report_model(
        project_id=project.id,
        report_type="Compliance Self-Report",
        display_name="Compliance Self-Report",
        phase="Construction",
    )
    package = factory_report_package_model(
        account_project, project_report, package_type_id=_report_type_b_id()
    )
    item = factory_item_model(package=package, item_type_id=1, status="NEW",
                              submitted_by=auth_guid)
    submission = factory_document_submission_model(
        item, created_by=auth_guid, folder="reports"
    )
    submission.status = status
    session.add(submission)
    session.flush()
    return submission


def test_acknowledge_verified_main_report_returns_ok(client, session, jwt):
    """Acknowledging a verified main report returns 200 with ACKNOWLEDGED status."""
    submission = _setup_compliance_report_main_document(session)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    with patch(EMAIL_TARGET):
        response = client.post(
            ACK_URL.format(submission_id=submission.id), headers=headers
        )

    assert response.status_code == HTTPStatus.OK
    assert response.get_json()["status"] == SubmissionStatus.ACKNOWLEDGED.value


def test_acknowledge_unknown_submission_returns_404(client, session, jwt):
    """Acknowledging a non-existent submission returns 404."""
    factory_user_model(auth_guid=TestJwtClaims.staff_admin_role["preferred_username"])
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.post(ACK_URL.format(submission_id=999999), headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_acknowledge_non_verified_document_returns_422(client, session, jwt):
    """Acknowledging a main report that is only SUBMITTED returns 422."""
    submission = _setup_compliance_report_main_document(
        session, status=SubmissionStatus.SUBMITTED
    )
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    with patch(EMAIL_TARGET) as mock_email:
        response = client.post(
            ACK_URL.format(submission_id=submission.id), headers=headers
        )

    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
    mock_email.assert_not_called()


def test_acknowledge_without_access_returns_403(client, session, jwt):
    """A proponent (no EAO edit access) is forbidden from acknowledging."""
    submission = _setup_compliance_report_main_document(session)

    # Authenticate as a proponent who lacks EAO edit permission on the package.
    proponent_guid = TestJwtClaims.proponent_role.value["preferred_username"]
    factory_user_model(auth_guid=proponent_guid, user_type=UserType.PROPONENT)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.proponent_role.value)

    with patch(EMAIL_TARGET) as mock_email:
        response = client.post(
            ACK_URL.format(submission_id=submission.id), headers=headers
        )

    assert response.status_code == HTTPStatus.FORBIDDEN
    mock_email.assert_not_called()
