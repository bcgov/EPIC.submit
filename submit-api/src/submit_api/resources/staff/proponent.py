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

from flask_restx import Namespace, Resource, cors

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.proponent import ProponentSchema
from submit_api.services.package import PackageService
from submit_api.services.proponent_service import ProponentService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import cors_preflight


API = Namespace("proponents", description="Endpoints for Proponent fetching")
"""Custom exception messages
"""

proponent_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ProponentSchema(), "Proponent"
)


@cors_preflight("GET, OPTIONS")
@API.route(
    "",
    methods=["GET", "OPTIONS"],
)
class Proponents(Resource):
    """Resource for fetching proponents."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get proponents")
    @API.response(
        code=HTTPStatus.OK, model=proponent_model, description="Get proponents"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    def get():
        """Get all proponents."""
        proponents = ProponentService.get_proponents()
        return ProponentSchema(many=True).dump(proponents), HTTPStatus.OK
