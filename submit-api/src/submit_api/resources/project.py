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

from submit_api.schemas.project import AccountProjectSchema, AddProjectSchema, ProjectSchema
from submit_api.services.project_service import ProjectService
from submit_api.utils.util import cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("projects", description="Endpoints for Project Management")
"""Custom exception messages
"""

project_add_list = ApiHelper.convert_ma_schema_to_restx_model(
    API, AddProjectSchema(), "Project Add"
)
project_list_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ProjectSchema(), "Project"
)


@cors_preflight("GET, OPTIONS, POST")
@API.route("/accounts/<int:account_id>", methods=["POST", "GET", "OPTIONS"])
class ProjectsByAccount(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Get projects by account id"
    )
    @API.expect(project_add_list)
    @API.response(
        code=HTTPStatus.CREATED, model=project_list_model, description="Get projects"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(account_id):
        """Get projects by account id."""
        projects = ProjectService.get_projects_by_account_id(account_id)
        return AccountProjectSchema(many=True).dump(projects), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Add projects in bulk")
    @API.expect(project_add_list)
    @API.response(
        code=HTTPStatus.CREATED, model=project_list_model, description="Added projects"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def post(account_id):
        """Add projects in bulk."""
        projects_data = AddProjectSchema().load(API.payload)
        added_projects = ProjectService.bulk_add_projects(
            account_id, projects_data.get("project_ids")
        )
        return ProjectSchema(many=True).dump(added_projects), HTTPStatus.CREATED


@cors_preflight("GET, OPTIONS, POST")
@API.route("/proponents/<int:proponent_id>", methods=["POST", "GET", "OPTIONS"])
class Project(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Get projects by proponent id"
    )
    @API.expect(project_add_list)
    @API.response(
        code=HTTPStatus.CREATED, model=project_list_model, description="Get project"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    def get(proponent_id):
        """Get projects by proponent id."""
        projects = ProjectService.get_projects_by_proponent_id(proponent_id)
        return ProjectSchema(many=True).dump(projects), HTTPStatus.OK


@cors_preflight("GET, OPTIONS, POST")
@API.route(
    "/<int:project_id>",
    methods=["POST", "GET", "OPTIONS"],
)
class Projects(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get project by project_id")
    @API.expect(project_add_list)
    @API.response(
        code=HTTPStatus.CREATED, model=project_list_model, description="Get project"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    def get(project_id):
        """Get projects by proponent id."""
        project = ProjectService.get_project_by_id(project_id)
        return AccountProjectSchema().dump(project), HTTPStatus.OK
