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
"""API endpoints for managing an item resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from submit_api.schemas.item import StaffItemSchema
from submit_api.services.item import ItemService
from submit_api.utils.util import cors_preflight

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper


API = Namespace("items", description="Endpoints for item Management")
"""Custom exception messages
"""

item_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffItemSchema(), "Submission item"
)


@cors_preflight("GET, OPTIONS")
@API.route("/<int:item_id>", methods=["GET", "OPTIONS"])
class Item(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Get item by id"
    )
    @API.response(
        code=HTTPStatus.OK, model=item_model, description="Submission item"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.require
    def get(item_id):
        """Get item by id."""
        projects = ItemService.get_item_by_id(item_id)
        return StaffItemSchema().dump(projects), HTTPStatus.OK
