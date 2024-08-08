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
from submit_api.utils.util import cors_preflight
from submit_api.exceptions import ResourceNotFoundError
from .apihelper import Api as ApiHelper
from ..schemas.user import UserSchema
from ..services.user_service import UserService

API = Namespace("users", description="Endpoints for Account Management")
"""Custom exception messages
"""

user_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, UserSchema(), "User"
)


@cors_preflight("GET, OPTIONS")
@API.route("/guid/<int:guid>", methods=["GET", "OPTIONS"])
@API.doc(params={"guid": "The user global unique identifier"})
class User(Resource):
    """Resource for managing a single account"""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Fetch a user by guid")
    @API.response(code=200, model=user_model, description="Success")
    @API.response(404, "Not Found")
    @cors.crossdomain(origin="*")
    def get(guid):
        """Fetch an account by id."""
        user = UserService.get_by_auth_guid(guid)
        if not user:
            return ResourceNotFoundError(f"User with guid {guid} not found")
        return UserSchema().dump(user), HTTPStatus.OK
