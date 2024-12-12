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
"""API endpoints for managing an account resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from submit_api.auth import auth
from submit_api.exceptions import ResourceNotFoundError
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.user import UserSchema
from submit_api.services.user_service import UserService
from submit_api.services.staff__user_service import StaffUserService
from submit_api.utils.util import cors_preflight
from submit_api.schemas.staff_user import StaffUserSchema


API = Namespace("staff_user", description="Endpoints for Staff Management")
"""Custom exception messages
"""

user_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffUserSchema(), "Staff User"
)


@cors_preflight("GET, OPTIONS, POST")
@API.route("/<string:guid>", methods=["GET", "OPTIONS"])
@API.doc(params={"guid": "The user global unique identifier"})
class StaffUser(Resource):
    """Resource for managing a single account"""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Fetch a staff by guid")
    @API.response(code=200, model=user_model, description="Success")
    @API.response(404, "Not Found")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(guid):
        """Fetch a staff by id."""
        staff = StaffUserService.get_staff_by_id(guid)
        if not staff:
            return ResourceNotFoundError(f"User with guid {guid} not found")
        return StaffUserSchema().dump(staff), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a staff user")
    @API.expect(user_model)
    @API.response(
        code=HTTPStatus.CREATED, model=user_model, description="Created Staff User"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def post():
        """Create a staff user."""
        staff = StaffUserService._create_staff_user(UserSchema().load(API.payload))
        return StaffUserSchema().dump(staff), HTTPStatus.CREATED