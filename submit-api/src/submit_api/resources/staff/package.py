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
from submit_api.schemas.package import CreateUpdateRequestSchema, PackageUpdateRequestSchema, StaffPackageSchema, \
    CreateUpdateRequestNoteSchema, PackageVersionSchema
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

create_update_request_note_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateUpdateRequestNoteSchema(), "CreateUpdateRequestNote"
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
    @auth.has_one_of_roles([EpicSubmitRole.EAO_VIEW.value])
    @cors.crossdomain(origin="*")
    def get(package_id):
        """Get a package."""
        package = PackageService.get_package_by_id(package_id)
        return StaffPackageSchema().dump(package), HTTPStatus.OK


@cors_preflight("GET, OPTIONS")
@API.route(
    "/<int:original_package_id>/versions",
    methods=["GET", "OPTIONS"],
)
class PackageVersions(Resource):
    """Resource for managing a packages versions."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get package versions")
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Get package versions"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_VIEW.value])
    @cors.crossdomain(origin="*")
    def get(original_package_id):
        """Get a package."""
        package_versions = PackageService.get_all_package_versions_by_original_package_id(original_package_id)
        return PackageVersionSchema(many=True).dump(package_versions), HTTPStatus.OK


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
        code=HTTPStatus.CREATED, model=package_model, description="Update Request"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_CREATE.value])
    @cors.crossdomain(origin="*")
    def post(package_id):
        """Create an update request."""
        create_update_request_data = CreateUpdateRequestSchema().load(API.payload)
        package_with_created_update_request = PackageService.create_update_request(
            package_id, create_update_request_data)
        return StaffPackageSchema().dump(package_with_created_update_request), HTTPStatus.CREATED


@cors_preflight("POST, OPTIONS")
@API.route(
    "/<int:package_id>/update-requests/<int:update_request_id>/note",
    methods=["POST", "OPTIONS"],
)
class PackageUpdateRequestNote(Resource):
    """Resource for managing a package's update request's note."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create an update request note for a package")
    @API.expect(create_update_request_note_model)
    @API.response(
        code=HTTPStatus.CREATED, model=package_model, description="Create Update Request Note"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @auth.require
    @cors.crossdomain(origin="*")
    def post(package_id, update_request_id):
        """Create an update request note."""
        create_update_request_data = CreateUpdateRequestNoteSchema().load(API.payload)
        package_with_update_request_note = PackageService.create_update_request_note(
            package_id, update_request_id, create_update_request_data)
        return StaffPackageSchema().dump(package_with_update_request_note), HTTPStatus.CREATED


@cors_preflight("GET, OPTIONS")
@API.route(
    "/",
    methods=["GET", "OPTIONS"],
)
class PackagesTest(Resource):
    """Resource for managing a package."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get package by id")
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Get package"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_VIEW.value])
    @cors.crossdomain(origin="*")
    def get():
        """Get packages."""
        packages = PackageService.get_all()
        return StaffPackageSchema(many=True).dump(packages), HTTPStatus.OK
