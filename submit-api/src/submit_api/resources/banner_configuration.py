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
"""API endpoints for managing banner configurations."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from submit_api.auth import auth
from submit_api.exceptions import UnprocessableEntityError
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.banner_configuration import (
    BannerConfigurationCreateSchema, BannerConfigurationSchema, BannerConfigurationUpdateSchema)
from submit_api.services.banner_configuration_service import BannerConfigurationService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import allowedorigins, cors_preflight


API = Namespace("banner-configurations", description="Endpoints for Banner Configuration Management")
"""Custom exception messages
"""

banner_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, BannerConfigurationSchema(), "Banner Configuration"
)

banner_create_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, BannerConfigurationCreateSchema(), "Banner Configuration Create Request"
)

banner_update_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, BannerConfigurationUpdateSchema(), "Banner Configuration Update Request"
)


@cors_preflight("GET, OPTIONS")
@API.route("/active", methods=["GET", "OPTIONS"])
class ActiveBannerConfiguration(Resource):
    """Public resource for fetching the active banner configuration."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Fetch the active banner configuration")
    @API.response(code=HTTPStatus.OK, model=banner_model, description="Success")
    @cross_origin(origins=allowedorigins())
    def get():
        """Fetch the single active banner configuration, if any.

        This endpoint is public: it powers the banner on the guest welcome page.
        """
        banner = BannerConfigurationService.get_active()
        if not banner:
            return {}, HTTPStatus.OK
        return BannerConfigurationSchema().dump(banner), HTTPStatus.OK


@cors_preflight("GET, POST, OPTIONS")
@API.route("", methods=["GET", "POST", "OPTIONS"])
class BannerConfigurations(Resource):
    """Resource for listing and creating banner configurations."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="List active banner configurations")
    @API.response(code=HTTPStatus.OK, model=[banner_model], description="Success")
    @auth.has_one_of_staff_roles([EpicSubmitRole.FULL_ACCESS.value])
    @cross_origin(origins=allowedorigins())
    def get():
        """List active banner configuration(s). At most one is ever active."""
        banner = BannerConfigurationService.get_active()
        banners = [banner] if banner else []
        return BannerConfigurationSchema(many=True).dump(banners), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a banner configuration")
    @API.expect(banner_create_model)
    @API.response(code=HTTPStatus.CREATED, model=banner_model, description="Created")
    @API.response(code=HTTPStatus.UNPROCESSABLE_ENTITY, description="Validation error")
    @auth.has_one_of_staff_roles([EpicSubmitRole.FULL_ACCESS.value])
    @cross_origin(origins=allowedorigins())
    def post():
        """Create a banner configuration."""
        try:
            data = BannerConfigurationCreateSchema().load(request.get_json())
        except ValidationError as err:
            raise UnprocessableEntityError(str(err.messages)) from err

        banner = BannerConfigurationService.create(data)
        return BannerConfigurationSchema().dump(banner), HTTPStatus.CREATED


@cors_preflight("PUT, OPTIONS")
@API.route("/<int:banner_id>", methods=["PUT", "OPTIONS"])
@API.doc(params={"banner_id": "The banner configuration identifier"})
class BannerConfigurationById(Resource):
    """Resource for updating a banner configuration."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Update a banner configuration")
    @API.expect(banner_update_model)
    @API.response(code=HTTPStatus.OK, model=banner_model, description="Updated")
    @API.response(code=HTTPStatus.NOT_FOUND, description="Not Found")
    @API.response(code=HTTPStatus.UNPROCESSABLE_ENTITY, description="Validation error")
    @auth.has_one_of_staff_roles([EpicSubmitRole.FULL_ACCESS.value])
    @cross_origin(origins=allowedorigins())
    def put(banner_id):
        """Update a banner configuration by id."""
        try:
            data = BannerConfigurationUpdateSchema().load(request.get_json())
        except ValidationError as err:
            raise UnprocessableEntityError(str(err.messages)) from err

        banner = BannerConfigurationService.update(banner_id, data)
        return BannerConfigurationSchema().dump(banner), HTTPStatus.OK
