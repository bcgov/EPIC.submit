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
from submit_api.schemas.package import StaffPackageSchema
from submit_api.services.package import PackageService
from submit_api.utils.util import cors_preflight


API = Namespace("packages", description="Endpoints for Package Management")
"""Custom exception messages
"""

package_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffPackageSchema(), "Package"
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
    @auth.require
    @cors.crossdomain(origin="*")
    def get(package_id):
        """Get a package."""
        package = PackageService.get_package_by_id(package_id)
        return StaffPackageSchema().dump(package), HTTPStatus.OK
