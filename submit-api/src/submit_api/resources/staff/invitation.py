# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""API endpoints for managing a invitation resource."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.invitation import (InvitationSchema, CreateInvitationToExistingAccountProjectSchema,
                                           CreateNewAccountInvitationSchema)
from submit_api.services.invitation_service import InvitationService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import allowedorigins, cors_preflight

API = Namespace("invitations", description="Endpoints for Invitation Management")

# Schema to handle input and output
invitation_add_schema = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateInvitationToExistingAccountProjectSchema(), "CreateInvitation"
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
    @API.response(HTTPStatus.CONFLICT, "User already exists")
    @auth.require
    @auth.has_one_of_roles([EpicSubmitRole.EAO_CREATE.value])
    @cross_origin(origins=allowedorigins())
    def post():
        """Generate and persist an invitation token."""
        payload = CreateNewAccountInvitationSchema().load(request.json)

        result = InvitationService.generate_new_entity_account_invitation(payload)

        if not result['success']:
            return result, HTTPStatus.CONFLICT

        # Return invitation data with the URL
        response = InvitationSchema().dump(result['invitation'])
        response['invitation_url'] = result['url']

        return response, HTTPStatus.CREATED
