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
"""API endpoints for managing a project resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.project import StaffAccountProjectSchema
from submit_api.services.project_service import ProjectService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import cors_preflight


API = Namespace("projects", description="Endpoints for Project Management")
"""Custom exception messages
"""

project_list_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffAccountProjectSchema(), "Project"
)


@cors_preflight("GET, OPTIONS")
@API.route(
    "",
    methods=["GET", "OPTIONS"],
)
class AccountProjects(Resource):
    """Resource for managing account projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get project by project_id")
    @API.response(
        code=HTTPStatus.OK, model=project_list_model, description="Get project"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_VIEW.value])
    @cors.crossdomain(origin="*")
    def get():
        """Get all account projects."""
        account_projects = ProjectService.get_all_account_projects()
        return StaffAccountProjectSchema(many=True).dump(account_projects), HTTPStatus.OK


@cors_preflight("GET, OPTIONS, POST")
@API.route(
    "/<int:account_project_id>",
    methods=["POST", "GET", "OPTIONS"],
)
class AccountProject(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get project by project_id")
    @API.response(
        code=HTTPStatus.CREATED, model=project_list_model, description="Get project"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_VIEW.value])
    def get(account_project_id):
        """Get project by id."""
        account_project = ProjectService.get_account_project_by_id(account_project_id)
        return StaffAccountProjectSchema().dump(account_project), HTTPStatus.OK
