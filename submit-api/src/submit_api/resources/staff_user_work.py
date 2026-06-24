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
"""API endpoints for managing staff user work assignments."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.staff_user_work import (
    RemoveStaffUserWorkRequest, StaffUserWorkSchema, CreateStaffUserWorkRequest
)
from submit_api.services.staff_user_work_service import StaffUserWorkService
from submit_api.utils.util import allowedorigins, cors_preflight
from submit_api.auth import auth

API = Namespace("staff-user-works", description="Endpoints for Staff User Work Management")

create_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateStaffUserWorkRequest(), "Create Staff User Work Request"
)

remove_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, RemoveStaffUserWorkRequest(), "Remove Staff User Work Request"
)

staff_user_work_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffUserWorkSchema(), "Staff User Work"
)


@cors_preflight("POST, OPTIONS")
@API.route("", methods=["POST", "OPTIONS"])
class StaffUserWorkResource(Resource):
    """Resource for creating/updating staff user work assignments from EPIC.track."""

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
    def post():
        """Create or update a staff user work assignment from EPIC.track."""
        request_data = request.get_json()
        email = request_data.get("email")
        work_id = request_data.get("work_id")
        role = request_data.get("role")

        if not email or not work_id or not role:
            return {
                "message": "All fields are required: 'email', 'work_id', and 'role'."
            }, HTTPStatus.BAD_REQUEST

        try:
            staff_user_work = StaffUserWorkService.create_or_update_staff_user_work(
                email=email,
                work_id=work_id,
                role=role
            )
            return StaffUserWorkSchema().dump(staff_user_work), HTTPStatus.CREATED
        except Exception as e:  # pylint:disable=broad-exception-caught  # noqa: B902
            return {"message": str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight("DELETE, OPTIONS")
@API.route("/remove", methods=["DELETE", "OPTIONS"])
class StaffUserWorkRemove(Resource):
    """Resource for removing staff user work assignments."""

    @staticmethod
    @auth.require
    @ApiHelper.swagger_decorators(
        API,
        endpoint_description="Remove staff user work assignment"
    )
    @API.expect(remove_request_model, validate=True)
    @API.response(code=200, description="Work assignment removed successfully")
    @API.response(code=400, description="Invalid input")
    @API.response(code=404, description="User or work assignment not found")
    @API.response(code=500, description="Internal server error")
    @cross_origin(origins=allowedorigins())
    def delete():
        """Remove a staff user work assignment."""
        request_data = request.get_json()
        email = request_data.get("email")
        work_id = request_data.get("work_id")

        if not email or not work_id:
            return {
                "message": "Both 'email' and 'work_id' are required."
            }, HTTPStatus.BAD_REQUEST

        try:
            StaffUserWorkService.remove_staff_user_work(
                email=email,
                work_id=work_id
            )
            return {
                "message": f"Work assignment removed for user '{email}' and work ID {work_id}."
            }, HTTPStatus.OK
        except Exception as e:  # pylint:disable=broad-exception-caught  # noqa: B902
            return {"message": str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR
