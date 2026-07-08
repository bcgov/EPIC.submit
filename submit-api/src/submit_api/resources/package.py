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

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.auth import auth, jwt
from submit_api.enums.package_operation import PackageOperation
from submit_api.enums.role import ProponentPermissionsEnum
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.package import (
    CreatePackageVersionSchema, CreateUpdateRequestNoteSchema, CreateUpdateRequestSchema, PackageSchema,
    PackageUpdateRequestSchema, PackageVersionSchema, PostPackageRequestSchema, PostPackageState, StaffPackageSchema,
    RefusePackageSchema)
from submit_api.services import authorization
from submit_api.services.package_access_control import PackageAccessControl
from submit_api.services.package_service import PackageService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import allowedorigins, cors_preflight


API = Namespace("packages", description="Endpoints for Package Management")
"""Custom exception messages
"""

create_package_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, PostPackageRequestSchema(), "Create a submission package"
)
package_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, PackageSchema(), "Submission Package"
)
create_update_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateUpdateRequestSchema(), "CreateUpdateRequest"
)
update_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, PackageUpdateRequestSchema(), "UpdateRequest"
)
create_update_request_note_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateUpdateRequestNoteSchema(), "CreateUpdateRequestNote"
)


@cors_preflight("GET, OPTIONS, POST")
@API.route("/<int:package_id>", methods=["POST", "GET", "OPTIONS"])
class Package(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Get package by id"
    )
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Submission Package"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.require
    def get(package_id):
        """Get package by id."""
        package = PackageService.get_package_by_id(package_id)
        if not package:
            return {"message": "Package not found"}, HTTPStatus.NOT_FOUND
        return PackageSchema().dump(package), HTTPStatus.OK


@cors_preflight("GET, OPTIONS, POST")
@API.route("/account-projects/<int:account_project_id>", methods=["POST", "GET", "OPTIONS"])
class PackageByAccountProject(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a submission package")
    @API.expect(create_package_model)
    @API.response(
        code=HTTPStatus.CREATED, model=package_model, description="Submission Package"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cross_origin(origins=allowedorigins())
    def post(account_project_id):
        """Create a submission package."""
        authorization.check_has_permissions_on_project(
            [ProponentPermissionsEnum.CREATE_PACKAGE.value],
            [account_project_id]
        )
        create_package_data = PostPackageRequestSchema().load(API.payload)
        created_package = PackageService.create_first_package(account_project_id, create_package_data)
        return PackageSchema().dump(created_package), HTTPStatus.CREATED


@cors_preflight("OPTIONS, POST")
@API.route("/<int:package_id>/state", methods=["POST", "OPTIONS"])
class PackageState(Resource):
    """Resource for managing packages state."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Update package state"
    )
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Updated Package"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.FORBIDDEN, "Forbidden - Team Lead access required for approval")
    @cross_origin(origins=allowedorigins())
    @auth.require
    def post(package_id):
        """Update package state."""
        request_body = PostPackageState().load(API.payload)
        # Check authorization for package EDIT access
        is_staff = jwt.contains_role([EpicSubmitRole.EAO_VIEW.value])
        if is_staff:
            PackageAccessControl.check_package_access(package_id, PackageOperation.EDIT)
        package = PackageService.update_package_state(package_id, request_body)
        return PackageSchema().dump(package), HTTPStatus.OK


@cors_preflight("GET, OPTIONS")
@API.route(
    "/<int:original_package_id>/versions",
    methods=["GET", "POST", "OPTIONS"],
)
class PackageVersions(Resource):
    """Resource for managing a packages versions."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get package versions")
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Get package versions"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    def get(original_package_id):
        """Get a package."""
        package_versions = PackageService.get_all_package_versions_by_original_package_id(original_package_id)
        return PackageVersionSchema(many=True).dump(package_versions), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a new package version")
    @API.response(
        code=HTTPStatus.CREATED, model=package_model, description="Create a new package version"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @cross_origin(origins=allowedorigins())
    @auth.require
    def post(original_package_id):  # pylint: disable=unused-argument
        """Create a new package version."""
        package_version_data = CreatePackageVersionSchema().load(API.payload)
        package_id = package_version_data.get("package_id")

        # Check package-aware access control (mp_create, w_create, or eao_create)
        PackageAccessControl.check_package_access(package_id, PackageOperation.CREATE)

        package_with_created_package_version = PackageService.create_new_package_version_with_contacts(package_id)
        return PackageSchema().dump(package_with_created_package_version), HTTPStatus.CREATED


@cors_preflight("POST, PATCH, OPTIONS")
@API.route(
    "/<int:package_id>/update-request",
    methods=["POST", "PATCH", "OPTIONS"],
)
class PackageUpdateRequests(Resource):
    """Resource for managing a package's update request."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create an update request for a package")
    @API.expect(create_update_request_model)
    @API.response(
        code=HTTPStatus.CREATED, model=package_model, description="Update Request"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @auth.require
    @cross_origin(origins=allowedorigins())
    def post(package_id):
        """Create an update request."""
        # Check basic package access (user can view the package)
        # Item-level permissions (including GIS) are validated in PackageService.create_update_request
        authorization.has_access_to_package(package_id)

        create_update_request_data = CreateUpdateRequestSchema().load(API.payload)
        package_with_created_update_request = PackageService.create_update_request(
            package_id, create_update_request_data)
        return StaffPackageSchema().dump(package_with_created_update_request), HTTPStatus.CREATED


@cors_preflight("POST, PATCH, DELETE, OPTIONS")
@API.route(
    "/<int:package_id>/update-request/<int:update_request_id>",
    methods=["POST", "PATCH", "DELETE", "OPTIONS"],
)
class PackageUpdateRequest(Resource):
    """Resource for managing a package's update request."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Accept a update request for a package")
    @API.expect(create_update_request_model)
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Update Request"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @auth.require
    @cross_origin(origins=allowedorigins())
    def patch(package_id, update_request_id):
        """Accept an update request."""
        # Check basic package access (user can view the package)
        # Item-level permissions (including GIS) are validated in PackageService.accept_update_request
        authorization.has_access_to_package(package_id)

        accept_update_request = PackageService.accept_update_request(package_id, update_request_id)
        return StaffPackageSchema().dump(accept_update_request), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Withdraw an update request for a package")
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Update Request Withdrawn"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @auth.require
    @cross_origin(origins=allowedorigins())
    def delete(package_id, update_request_id):
        """Withdraw an update request."""
        # Check basic package access (user can view the package)
        # Item-level permissions (including GIS) are validated in PackageService.withdraw_update_request
        authorization.has_access_to_package(package_id)

        withdraw_update_request = PackageService.withdraw_update_request(package_id, update_request_id)
        return StaffPackageSchema().dump(withdraw_update_request), HTTPStatus.OK


@cors_preflight("POST, PATCH, OPTIONS")
@API.route(
    "/<int:package_id>/update-requests/<int:update_request_id>/note",
    methods=["POST", "PATCH", "OPTIONS"],
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
    @cross_origin(origins=allowedorigins())
    def post(package_id, update_request_id):
        """Create an update request note."""
        create_update_request_data = CreateUpdateRequestNoteSchema().load(API.payload)
        package_with_update_request_note = PackageService.create_update_request_note(
            package_id, update_request_id, create_update_request_data)
        return PackageSchema().dump(package_with_update_request_note), HTTPStatus.CREATED

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Update an existing update request note for a package")
    @API.expect(create_update_request_note_model)
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Update Update Request Note"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @auth.require
    @cross_origin(origins=allowedorigins())
    def patch(package_id, update_request_id):
        """Update an existing update request note."""
        update_note_data = CreateUpdateRequestNoteSchema().load(API.payload)
        package_with_updated_note = PackageService.update_update_request_note(
            package_id, update_request_id, update_note_data)
        return PackageSchema().dump(package_with_updated_note), HTTPStatus.OK


@cors_preflight("OPTIONS, POST")
@API.route("/<int:package_id>/refuse", methods=["POST", "OPTIONS"])
class RefusePackage(Resource):
    """Resource for refusing a package."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Refuse package"
    )
    @API.response(
        code=HTTPStatus.CREATED, model=package_model, description="Refused package"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.require
    def post(package_id):
        """Refuse package."""
        request_body = RefusePackageSchema().load(API.payload)
        new_package = PackageService.refuse_package(package_id, request_body.get("decision_date"))
        return PackageSchema().dump(new_package), HTTPStatus.CREATED


@cors_preflight("OPTIONS, POST")
@API.route("/<int:package_id>/withdraw", methods=["POST", "OPTIONS"])
class WithdrawPackage(Resource):
    """Resource for withdrawing a package."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Withdraw a submitted package"
    )
    @API.response(
        code=HTTPStatus.OK, model=package_model, description="Withdrawn package"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @cross_origin(origins=allowedorigins())
    @auth.require
    def post(package_id):
        """Withdraw a submitted package."""
        withdrawn_package = PackageService.withdraw_package(package_id)
        return PackageSchema().dump(withdrawn_package), HTTPStatus.OK
