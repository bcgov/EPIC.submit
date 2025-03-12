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

from flask import request
from flask_restx import Namespace, Resource, cors

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.account_user import AccountUserSchema
from submit_api.services.account_user_service import AccountUserService
from submit_api.utils.util import cors_preflight

API = Namespace("accounts", description="Endpoints for Account User Management")
"""Custom exception messages
"""

account_user_list_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, AccountUserSchema(), "AccountUser"
)


@cors_preflight("GET, OPTIONS")
@API.route("/<int:account_id>/users", methods=["GET", "OPTIONS"])
@API.doc(params={
    "account_id": "The account identifier",
    "include_invitees": "Include invitees (true/false)",
    "include_roles": "Include roles (true/false)"
})
class AccountUsers(Resource):
    """Resource for listing users associated with an account."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Fetch all users of an account")
    @API.response(code=HTTPStatus.OK, description="Success", model=[account_user_list_model])
    @API.response(HTTPStatus.NOT_FOUND, "Account not found")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(account_id):
        """Fetch all users of a specific account."""
        include_roles = request.args.get("include_roles", "false").lower() == "true"
        include_invitees = request.args.get("include_invitees", "false").lower() == "true"
        users = AccountUserService.get_users_by_account(account_id, include_roles, include_invitees)
        if not users:
            return {"message": f"No users found for account {account_id}"}, HTTPStatus.NOT_FOUND

        users_list_schema = AccountUserSchema(many=True)
        return users_list_schema.dump(users), HTTPStatus.OK


@cors_preflight("GET, PATCH, OPTIONS")
@API.route("/user/<string:guid>", methods=["GET", "PATCH", "OPTIONS"])
@API.doc(params={"user_id": "The user identifier"})
class AccountUser(Resource):
    """Resource for fetching or editing a user."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Fetch an user for a user id")
    @API.response(code=HTTPStatus.OK, description="Success", model=[account_user_list_model])
    @API.response(HTTPStatus.NOT_FOUND, "User not found")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(guid):
        """Fetch an user for a user id."""
        user = AccountUserService.get_account_user(guid)
        if not user:
            return {"message": f"No user found for user id {guid}"}, HTTPStatus.NOT_FOUND
        return AccountUserSchema().dump(user), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Edit a account user")
    @API.expect(account_user_list_model)
    @API.response(
        code=HTTPStatus.OK, model=account_user_list_model, description="Account user"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def patch(guid):
        """Edit a account user."""
        edit_account_user_data = AccountUserSchema().load(API.payload)
        edited_account_user = AccountUserService.update_account_user(guid, edit_account_user_data)
        return AccountUserSchema().dump(edited_account_user), HTTPStatus.OK
