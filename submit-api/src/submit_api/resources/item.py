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

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.auth import auth, jwt
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.item import ItemSchema
from submit_api.schemas.item import StaffItemSchema
from submit_api.schemas.submission_review import SaveSubmissionReviewRequestSchema, SubmissionReviewSchema
from submit_api.services.item_service import ItemService
from submit_api.services.submission_review_service import SubmissionReviewService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import allowedorigins, cors_preflight


API = Namespace("items", description="Endpoints for item Management")
"""Custom exception messages
"""

item_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ItemSchema(), "Submission item"
)
staff_item_model = ApiHelper.convert_ma_schema_to_restx_model(
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
    @cross_origin(origins=allowedorigins())
    @auth.require
    def get(item_id):
        """Get item by id."""
        is_staff = jwt.contains_role([EpicSubmitRole.EAO_VIEW.value])
        item = ItemService.get_item_by_id(item_id)
        if is_staff:
            return StaffItemSchema().dump(item), HTTPStatus.OK
        return ItemSchema().dump(item), HTTPStatus.OK


@cors_preflight("GET, OPTIONS, POST, DELETE")
@API.route("/<int:item_id>/review", methods=["GET", "OPTIONS", "POST", "DELETE"])
class ItemReview(Resource):
    """Resource for managing submission item reviews."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Save a review for an item"
    )
    @API.response(
        code=HTTPStatus.OK, model=item_model, description="Submission item review"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_staff_roles([EpicSubmitRole.EAO_CREATE.value])
    def post(item_id):
        """Save submission review."""
        request_body = SaveSubmissionReviewRequestSchema().load(API.payload)
        review = SubmissionReviewService.save_submission_review(item_id, request_body)
        return SubmissionReviewSchema().dump(review), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Undo the TM staff recommendation for an item review"
    )
    @API.response(
        code=HTTPStatus.OK, model=item_model, description="Submission item review"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_staff_roles([EpicSubmitRole.EAO_CREATE.value])
    def delete(item_id):
        """Undo staff recommendation."""
        review = SubmissionReviewService.undo_staff_recommendation(item_id)
        return SubmissionReviewSchema().dump(review), HTTPStatus.OK
