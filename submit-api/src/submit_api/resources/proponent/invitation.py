from http import HTTPStatus
from flask import request
from flask_restx import Namespace, Resource, cors
from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.services.invitation_service import InvitationService
from submit_api.schemas.invitation import InvitationSchema, CreateInvitationSchema
from submit_api.utils.util import cors_preflight


API = Namespace("invitations", description="Endpoints for Invitation Management")

# Schema to handle input and output
invitation_add_schema = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateInvitationSchema(), "CreateInvitation"
)
invitation_response_schema = ApiHelper.convert_ma_schema_to_restx_model(
    API, InvitationSchema(), "Invitation"
)


@cors_preflight("POST, OPTIONS")
@API.route("", methods=["POST", "OPTIONS"])
class InvitationsResource(Resource):
    """Resource to create and manage invitation tokens."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Create a new invitation token"
    )
    @API.expect(invitation_add_schema)
    @API.response(
        code=HTTPStatus.CREATED,
        model=invitation_response_schema,
        description="Invitation token created",
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Invalid input data")
    @auth.require
    @cors.crossdomain(origin="*")
    def post():
        """Generate and persist an invitation token."""
        payload = CreateInvitationSchema().load(request.json)

        invitation = InvitationService.create_invitation(
            account_id=payload["account_id"],
            project_ids=payload["project_ids"],
            email=payload.get("email"),
        )
        return InvitationSchema().dump(invitation), HTTPStatus.CREATED


@cors_preflight("GET, DELETE, OPTIONS")
@API.route("/<string:token>", methods=["GET", "DELETE", "OPTIONS"])
class InvitationDetailResource(Resource):
    """Resource to manage individual invitations by token."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get invitation by token")
    @API.response(HTTPStatus.OK, "Invitation found")
    @API.response(HTTPStatus.NOT_FOUND, "Invitation not found")
    @auth.require
    def get(token):
        """Retrieve invitation by token."""
        invitation = InvitationService.get_by_token(token)
        if invitation:
            return InvitationSchema().dump(invitation), HTTPStatus.OK
        return {"error": "Invitation not found"}, HTTPStatus.NOT_FOUND

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Revoke invitation by token")
    @API.response(HTTPStatus.NO_CONTENT, "Invitation revoked")
    @API.response(HTTPStatus.NOT_FOUND, "Invitation not found")
    @auth.require
    def delete(token):
        """Revoke an invitation token."""
        result = InvitationService.revoke_invitation(token)
        if result:
            return {}, HTTPStatus.NO_CONTENT
        return {"error": "Invitation not found or already used"}, HTTPStatus.NOT_FOUND
