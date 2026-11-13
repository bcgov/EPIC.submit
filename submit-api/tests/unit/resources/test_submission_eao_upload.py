"""Resource tests for adding report/notification documents on behalf of the holder.

POST /api/submissions/items/{item_id} with ``is_eao_upload`` lets MPT Staff and
MPT Manager add a document the EAO received outside EPIC.submit. DELETE
/api/submissions/{id}/document removes it again (used to undo a partly saved batch).
"""
from datetime import date, timedelta
from http import HTTPStatus
from unittest.mock import patch

from submit_api.enums.package_type import PackageTypeEnum
from submit_api.models.db import db
from submit_api.models.item_type import ItemType
from submit_api.models.package_type import PackageType
from submit_api.models.staff_user import StaffUser
from submit_api.models.submission import Submission, SubmissionStatus
from submit_api.models.user import UserType
from submit_api.utils.roles import EpicSubmitRole
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_auth_header,
    factory_item_model,
    factory_package_model,
    factory_project_model,
    factory_project_report_model,
    factory_report_package_model,
    factory_user_model,
)

REPORT_ITEM_TYPE_NAME = "Document(s) Upload"
CREATE_URL = "/api/submissions/items/{item_id}"
DELETE_URL = "/api/submissions/{submission_id}/document"


def _claims(roles):
    """Staff claims carrying exactly the given realm roles."""
    return {**TestJwtClaims.staff_admin_role, "realm_access": {"roles": roles}}


MPT_STAFF = _claims([EpicSubmitRole.EAO_VIEW.value, EpicSubmitRole.MP_EDIT.value])
MPT_MANAGER = _claims([EpicSubmitRole.EAO_VIEW.value, EpicSubmitRole.MP_EXTENDED_EDIT.value])
EAO_ONLY = _claims([EpicSubmitRole.EAO_VIEW.value, EpicSubmitRole.EAO_EDIT.value])


def _payload(received_date=None, **overrides):
    """Request body for one EAO-uploaded document."""
    body = {
        "type": "DOCUMENT",
        "sort_order": 0,
        "is_eao_upload": True,
        "received_date": (received_date or date.today() - timedelta(days=3)).isoformat(),
        "data": {"name": "received_by_email.pdf", "url": "reports/received_by_email.pdf", "folder": "reports"},
    }
    body.update(overrides)
    return body


def _report_item(package_type=PackageTypeEnum.REPORT):
    """Create a report package with one item and return the item."""
    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    project_report = factory_project_report_model(
        project_id=project.id,
        report_type="Compliance Self-Report",
        display_name="Compliance Self-Report",
        phase="Construction",
    )
    type_id = PackageType.find_by_name(package_type.value).id
    package = factory_report_package_model(account_project, project_report, package_type_id=type_id)
    upload_item_type = ItemType.query.filter_by(name=REPORT_ITEM_TYPE_NAME).one()
    return factory_item_model(package=package, item_type_id=upload_item_type.id, status="NEW", submitted_by="seed")


def _as_staff(claims, first_name="Jordan", last_name="Lee"):
    """Create the staff user (and staff profile) matching the claims; return the auth guid."""
    auth_guid = claims["preferred_username"]
    user = factory_user_model(auth_guid=auth_guid)
    db.session.add(StaffUser(
        first_name=first_name, last_name=last_name, work_email_address="jordan@example.com", user_id=user.id,
    ))
    db.session.commit()
    return auth_guid


def _post(client, jwt, item, body, claims=MPT_STAFF):
    """POST an EAO upload as the given staff claims."""
    return client.post(
        CREATE_URL.format(item_id=item.id), json=body, headers=factory_auth_header(jwt=jwt, claims=claims)
    )


class TestEaoUploadCreate:
    """POST /submissions/items/{id} with is_eao_upload."""

    def test_mpt_staff_adds_document(self, client, session, jwt):
        """MPT Staff get 201; the row is SUBMITTED, flagged EAO-uploaded and keeps the date received."""
        _as_staff(MPT_STAFF)
        item = _report_item()
        received = date.today() - timedelta(days=3)

        response = _post(client, jwt, item, _payload(received))

        assert response.status_code == HTTPStatus.CREATED, response.get_data(as_text=True)
        body = response.get_json()
        assert body["is_eao_uploaded"] is True
        assert body["received_date"] == received.isoformat()
        assert body["status"] == SubmissionStatus.SUBMITTED.value
        assert body["submitted_by"] == "Jordan Lee"

    def test_upload_is_stored_against_the_staff_auth_guid(self, client, session, jwt):
        """The row keeps the staff member's auth_guid in created_by, whatever name is shown."""
        auth_guid = _as_staff(MPT_STAFF)
        item = _report_item()

        response = _post(client, jwt, item, _payload())

        assert response.status_code == HTTPStatus.CREATED
        assert Submission.find_by_id(response.get_json()["id"]).created_by == auth_guid

    def test_mpt_manager_adds_document(self, client, session, jwt):
        """MPT Manager (mp_extended_edit) is also allowed."""
        _as_staff(MPT_MANAGER)
        item = _report_item()

        response = _post(client, jwt, item, _payload(), claims=MPT_MANAGER)

        assert response.status_code == HTTPStatus.CREATED

    def test_full_access_adds_document(self, client, session, jwt):
        """full_access bypasses the MPT role check."""
        _as_staff(TestJwtClaims.staff_admin_role)
        item = _report_item()

        response = _post(client, jwt, item, _payload(), claims=TestJwtClaims.staff_admin_role)

        assert response.status_code == HTTPStatus.CREATED

    def test_upload_does_not_submit_the_package(self, client, session, jwt):
        """Adding a document never records a package submission or flags the row as updated."""
        _as_staff(MPT_STAFF)
        item = _report_item()

        response = _post(client, jwt, item, _payload())

        assert response.status_code == HTTPStatus.CREATED
        submission = Submission.find_by_id(response.get_json()["id"])
        assert submission.is_updated is False
        assert submission.item.package.submitted_on is None
        assert submission.item.package.submitted_by is None

    def test_requires_authentication(self, client, session):
        """No token returns 401."""
        item = _report_item()

        response = client.post(CREATE_URL.format(item_id=item.id), json=_payload())

        assert response.status_code == HTTPStatus.UNAUTHORIZED

    def test_staff_without_mpt_role_is_forbidden(self, client, session, jwt):
        """Staff with only eao_* roles get 403 and nothing is saved."""
        _as_staff(EAO_ONLY)
        item = _report_item()

        response = _post(client, jwt, item, _payload(), claims=EAO_ONLY)

        assert response.status_code == HTTPStatus.FORBIDDEN
        assert Submission.query.filter_by(item_id=item.id).count() == 0

    def test_proponent_cannot_use_eao_upload(self, client, session, jwt):
        """A Regulated Party user cannot claim EAO-upload."""
        proponent = TestJwtClaims.proponent_role.value
        factory_user_model(auth_guid=proponent["preferred_username"], user_type=UserType.PROPONENT)
        item = _report_item()

        response = _post(client, jwt, item, _payload(), claims=proponent)

        assert response.status_code in (HTTPStatus.FORBIDDEN, HTTPStatus.UNAUTHORIZED)
        assert Submission.query.filter_by(item_id=item.id).count() == 0

    def test_missing_date_is_unprocessable(self, client, session, jwt):
        """No Date Received returns 422."""
        _as_staff(MPT_STAFF)
        item = _report_item()
        body = _payload()
        body.pop("received_date")

        response = _post(client, jwt, item, body)

        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
        assert Submission.query.filter_by(item_id=item.id).count() == 0

    def test_future_date_is_unprocessable(self, client, session, jwt):
        """A Date Received in the future returns 422."""
        _as_staff(MPT_STAFF)
        item = _report_item()

        response = _post(client, jwt, item, _payload(date.today() + timedelta(days=2)))

        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY

    def test_non_report_package_is_unprocessable(self, client, session, jwt):
        """EAO upload is only for report/notification packages."""
        claims = _claims([EpicSubmitRole.MP_VIEW.value, EpicSubmitRole.MP_EDIT.value])
        _as_staff(claims)
        package = factory_package_model(package_type_id=1)
        item = factory_item_model(package=package, item_type_id=1, status="NEW", submitted_by="seed")

        response = _post(client, jwt, item, _payload(), claims=claims)

        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY

    def test_received_date_without_flag_is_unprocessable(self, client, session, jwt):
        """A normal upload cannot smuggle in a received date."""
        _as_staff(MPT_STAFF)
        item = _report_item()

        response = _post(client, jwt, item, _payload(is_eao_upload=False))

        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY

    def test_client_cannot_flag_eao_through_document_data(self, client, session, jwt):
        """is_eao_uploaded inside data is ignored for a normal upload."""
        _as_staff(MPT_STAFF)
        item = _report_item()
        body = _payload(is_eao_upload=False)
        body.pop("received_date")
        body["data"]["is_eao_uploaded"] = True

        response = _post(client, jwt, item, body)

        assert response.status_code == HTTPStatus.CREATED
        assert response.get_json()["is_eao_uploaded"] is False


class TestEaoUploadDelete:
    """DELETE /submissions/{id}/document for EAO-uploaded rows (rollback of a partial batch)."""

    def test_mpt_staff_can_delete_their_upload(self, client, session, jwt):
        """The roles that can add can also remove."""
        _as_staff(MPT_STAFF)
        item = _report_item()
        created = _post(client, jwt, item, _payload()).get_json()

        response = client.delete(
            DELETE_URL.format(submission_id=created["id"]),
            headers=factory_auth_header(jwt=jwt, claims=MPT_STAFF),
        )

        assert response.status_code == HTTPStatus.OK
        assert Submission.find_by_id(created["id"]) is None

    def test_staff_without_mpt_role_cannot_delete(self, client, session, jwt):
        """Staff without an MPT role get 403 and the row stays."""
        _as_staff(EAO_ONLY)
        item = _report_item()
        # Same user, but created while holding an MPT role.
        created = _post(client, jwt, item, _payload(), claims=MPT_STAFF).get_json()

        response = client.delete(
            DELETE_URL.format(submission_id=created["id"]),
            headers=factory_auth_header(jwt=jwt, claims=EAO_ONLY),
        )

        assert response.status_code == HTTPStatus.FORBIDDEN
        assert Submission.find_by_id(created["id"]) is not None


class TestEaoUploadVisibility:
    """Who sees whom in Submitted By."""

    def test_regulated_party_sees_eao_instead_of_staff_name(self, client, session, jwt):
        """The schema masks the staff name for non-staff viewers."""
        from submit_api.schemas.submission import resolve_submitted_by

        auth_guid = _as_staff(MPT_STAFF)
        item = _report_item()
        created = _post(client, jwt, item, _payload()).get_json()
        submission = Submission.find_by_id(created["id"])
        assert submission.created_by == auth_guid

        assert resolve_submitted_by(submission) == "Jordan Lee"
        with patch("submit_api.schemas.submission.viewer_is_staff", return_value=False):
            assert resolve_submitted_by(submission) == "EAO"

    def test_regulated_party_payload_hides_staff_identity(self, client, session, jwt):
        """The item payload for a non-staff viewer carries neither the staff name nor login."""
        from submit_api.schemas.item import ItemSubmissionSchema

        auth_guid = _as_staff(MPT_STAFF)
        item = _report_item()
        created = _post(client, jwt, item, _payload()).get_json()
        submission = Submission.find_by_id(created["id"])

        with patch("submit_api.schemas.item.viewer_is_staff", return_value=False), \
                patch("submit_api.schemas.submission.viewer_is_staff", return_value=False):
            payload = ItemSubmissionSchema().dump(submission)

        assert payload["submitted_by"] == "EAO"
        assert payload["created_by"] is None
        assert payload["submitted_document"]["created_by"] is None
        assert auth_guid not in str(payload)

    def test_staff_payload_keeps_staff_name(self, client, session, jwt):
        """Staff still see who added the document."""
        from submit_api.schemas.item import ItemSubmissionSchema

        _as_staff(MPT_STAFF)
        item = _report_item()
        created = _post(client, jwt, item, _payload()).get_json()
        submission = Submission.find_by_id(created["id"])

        with patch("submit_api.schemas.item.viewer_is_staff", return_value=True), \
                patch("submit_api.schemas.submission.viewer_is_staff", return_value=True):
            payload = ItemSubmissionSchema().dump(submission)

        assert payload["submitted_by"] == "Jordan Lee"
        assert payload["created_by"] is not None
