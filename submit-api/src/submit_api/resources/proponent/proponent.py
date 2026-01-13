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
"""API endpoints for managing a proponent resource."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.exceptions import ResourceNotFoundError
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.proponent import ProponentSchema
from submit_api.services.proponent_service import ProponentService
from submit_api.utils.util import allowedorigins, cors_preflight


API = Namespace("proponents", description="Endpoints for Proponent fetching")

proponent_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ProponentSchema(), "Proponent"
)


@cors_preflight("GET, OPTIONS")
@API.route(
    "",
    methods=["GET", "OPTIONS"],
)
class AllProponents(Resource):
    """Resource for fetching all proponents."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get all proponents")
    @API.response(
        code=HTTPStatus.OK, model=proponent_model, description="Get all proponents"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    def get():
        """Get all proponents.

        Query parameters:
        - approved-conditions: If 'true', returns only proponents with approved conditions.
                                  If not provided, returns all proponents regardless of approved conditions.
        """
        approved_conditions_param = request.args.get("approved-conditions")
        approved_conditions_only = approved_conditions_param.lower() == "true" if approved_conditions_param else None
        proponents = ProponentService.get_all_proponents(
            include_deleted=False,
            approved_conditions_only=approved_conditions_only
        )
        return ProponentSchema(many=True).dump(proponents), HTTPStatus.OK


@cors_preflight("GET, OPTIONS")
@API.route(
    "/<int:proponent_id>",
    methods=["GET", "OPTIONS"],
)
class Proponent(Resource):
    """Resource for fetching proponents."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get proponents")
    @API.response(
        code=HTTPStatus.OK, model=proponent_model, description="Get proponents"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    def get(proponent_id):
        """Get a proponent by id."""
        include_invitations = request.args.get("include-invitations", "false").lower() == "true"
        include_projects = request.args.get("include-projects", "false").lower() == "true"
        proponent = ProponentService.get_proponent(proponent_id, include_invitations, include_projects)
        if not proponent:
            raise ResourceNotFoundError(f"Proponent with id {proponent_id} not found")
        return proponent, HTTPStatus.OK
