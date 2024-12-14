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
"""API endpoints for managing a package resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.package import StaffPackageSchema, CreateUpdateRequestSchema, PackageUpdateRequestSchema
from submit_api.services.package import PackageService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import cors_preflight


API = Namespace("packages", description="Endpoints for Package Management")
"""Custom exception messages
"""

package_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffPackageSchema(), "Package"
)

create_update_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateUpdateRequestSchema(), "CreateUpdateRequest"
)

update_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, PackageUpdateRequestSchema(), "UpdateRequest"
)


@cors_preflight("GET, OPTIONS")
@API.route(
    "/<int:package_id>",
    methods=["GET", "OPTIONS"],
)
class Package(Resource):
    """Resource for managing a package."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get package by id")
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Get package"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_VIEW])
    @cors.crossdomain(origin="*")
    def get(package_id):
        """Get a package."""
        package = PackageService.get_package_by_id(package_id)
        return StaffPackageSchema().dump(package), HTTPStatus.OK


@cors_preflight("POST, OPTIONS")
@API.route(
    "/<int:package_id>/update-request",
    methods=["POST", "OPTIONS"],
)
class PackageUpdateRequest(Resource):
    """Resource for managing a package's update request."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create an update request for a package")
    @API.expect(create_update_request_model)
    @API.response(
        code=HTTPStatus.CREATED, model=update_request_model, description="Update Request"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_CREATE])
    @cors.crossdomain(origin="*")
    def post(package_id):
        """Create an update request."""
        create_update_request_data = CreateUpdateRequestSchema().load(API.payload)
        created_update_request = PackageService.create_update_request(package_id, create_update_request_data)
        return PackageUpdateRequestSchema().dump(created_update_request), HTTPStatus.CREATED
