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
"""API endpoints for managing staff user work assignments. Consumed in the cronJob"""

from http import HTTPStatus

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.staff_user_work import (
    StaffUserWorkSchema, CreateStaffUserWorkRequest,
    StaffWorkRoleResponseSchema
)
from submit_api.services.staff_user_work_service import StaffUserWorkService
from submit_api.utils.util import allowedorigins, cors_preflight
from submit_api.auth import auth
from submit_api.utils.roles import EpicSubmitRole

API = Namespace("staff-user-works", description="Endpoints for Staff User Work Management")

create_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateStaffUserWorkRequest(), "Create Staff User Work Request"
)

staff_user_work_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffUserWorkSchema(), "Staff User Work"
)

staff_work_role_response_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffWorkRoleResponseSchema(), "Staff Work Role Response"
)


@cors_preflight("GET, POST, OPTIONS")
@API.route("", methods=["GET", "POST", "OPTIONS"])
class StaffUserWorkResource(Resource):
    """Resource for creating/updating staff user work assignments from EPIC.track."""

    @staticmethod
    @auth.require
    @ApiHelper.swagger_decorators(
        API,
        endpoint_description="Get all active staff work role assignments"
    )
    @API.response(code=200, model=[staff_work_role_response_model], description="List of staff work roles")
    @API.response(code=500, description="Internal server error")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_staff_roles([EpicSubmitRole.MANAGE_USERS.value])
    def get():
        """Get all active staff work role assignments with email and basic details."""
        try:
            staff_work_roles = StaffUserWorkService.get_all_staff_work_roles()
            return StaffWorkRoleResponseSchema(many=True).dump(staff_work_roles), HTTPStatus.OK
        except Exception as e:  # pylint:disable=broad-exception-caught  # noqa: B902
            return {"message": str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @auth.require
    @ApiHelper.swagger_decorators(
        API,
        endpoint_description="Create or update staff user work assignment from EPIC.track"
    )
    @API.expect(create_request_model, validate=True)
    @API.response(code=201, model=staff_user_work_model, description="Work assignment created/updated")
    @API.response(code=400, description="Invalid input")
    @API.response(code=404, description="User not found in Keycloak or work doesn't exist")
    @API.response(code=500, description="Internal server error")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_staff_roles([EpicSubmitRole.MANAGE_USERS.value])
    def post():
        """Create or update a staff user work assignment from EPIC.track."""
        request_data = CreateStaffUserWorkRequest().load(API.payload)
        try:
            staff_user_work = StaffUserWorkService.create_or_update_staff_user_work(
                email=request_data.get("email"),
                work_id=request_data.get("work_id"),
                role=request_data.get("role")
            )
            return StaffUserWorkSchema().dump(staff_user_work), HTTPStatus.CREATED
        except Exception as e:  # pylint:disable=broad-exception-caught  # noqa: B902
            return {"message": str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight("DELETE, OPTIONS")
@API.route("/work/<int:work_id>", methods=["DELETE", "OPTIONS"])
@API.doc(params={"work_id": "The work ID from EPIC.track"})
class StaffUserWorkRemoveByWork(Resource):
    """Resource for removing staff user work assignments by work ID."""

    @staticmethod
    @auth.require
    @ApiHelper.swagger_decorators(
        API,
        endpoint_description="Remove staff user work assignment by work ID"
    )
    @API.response(code=200, description="Work assignment removed successfully")
    @API.response(code=404, description="Work assignment not found")
    @API.response(code=500, description="Internal server error")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_staff_roles([EpicSubmitRole.MANAGE_USERS.value])
    def delete(work_id):
        """Remove a staff user work assignment by work ID."""
        try:
            StaffUserWorkService.remove_staff_user_work_by_work_id(work_id=work_id)
            return {
                "message": f"Work assignment(s) removed for work ID {work_id}."
            }, HTTPStatus.OK
        except Exception as e:  # pylint:disable=broad-exception-caught  # noqa: B902
            return {"message": str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight("DELETE, OPTIONS")
@API.route("/user/<string:auth_guid>", methods=["DELETE", "OPTIONS"])
@API.doc(params={"auth_guid": "The user's authentication GUID"})
class StaffUserWorkRemoveByUser(Resource):
    """Resource for removing all staff user work assignments by user auth_guid."""

    @staticmethod
    @auth.require
    @ApiHelper.swagger_decorators(
        API,
        endpoint_description="Remove all staff user work assignments by user auth_guid"
    )
    @API.response(code=200, description="Work assignments removed successfully")
    @API.response(code=404, description="User not found")
    @API.response(code=500, description="Internal server error")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_staff_roles([EpicSubmitRole.MANAGE_USERS.value])
    def delete(auth_guid):
        """Remove all staff user work assignments for a user by their auth_guid."""
        try:
            StaffUserWorkService.remove_staff_user_works_by_auth_guid(
                auth_guid=auth_guid
            )
            return {
                "message": f"All work assignments removed for user with auth_guid '{auth_guid}'."
            }, HTTPStatus.OK
        except Exception as e:  # pylint:disable=broad-exception-caught  # noqa: B902
            return {"message": str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR
