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
"""API endpoints for managing a submission resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.submission import CreateSubmissionRequestSchema, SubmissionSchema
from submit_api.services.submission import SubmissionService
from submit_api.utils.util import cors_preflight


API = Namespace("submissions", description="Endpoints for Submission Management")
"""Custom exception messages
"""

create_submission_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateSubmissionRequestSchema(), "Create a submission"
)
submission_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, SubmissionSchema(), "Submission"
)


@cors_preflight("GET, OPTIONS, POST")
@API.route("/items/<int:submission_item_id>", methods=["POST", "GET", "OPTIONS"])
class SubmissionByItem(Resource):
    """Resource for managing submissions."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a submission")
    @API.expect(create_submission_model)
    @API.response(
        code=HTTPStatus.CREATED, model=submission_model, description="Submission"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.require
    def post(submission_item_id):
        """Create a submission."""
        create_submission_data = CreateSubmissionRequestSchema().load(API.payload)
        created_submission = SubmissionService.create_submission(submission_item_id, create_submission_data)
        return SubmissionSchema().dump(created_submission), HTTPStatus.CREATED


@cors_preflight("GET, OPTIONS, PATCH")
@API.route("/<int:submission_id>/form", methods=["PATCH", "GET", "OPTIONS"])
class Submissions(Resource):
    """Resource for managing submissions."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Edit a submission")
    @API.expect(create_submission_model)
    @API.response(
        code=HTTPStatus.OK, model=submission_model, description="Submission"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.require
    def patch(submission_id):
        """Edit a submission."""
        edit_submission_data = CreateSubmissionRequestSchema().load(API.payload)
        edited_submission = SubmissionService.edit_submission_form(submission_id, edit_submission_data)
        item_id = edit_submission_data.get("item_id")
        status = edit_submission_data.get("status")
        if status:
            SubmissionService.update_submission_item_status(item_id, status)
        return SubmissionSchema().dump(edited_submission), HTTPStatus.OK


@cors_preflight("GET, OPTIONS, PATCH")
@API.route("/<int:submission_id>/document", methods=["PATCH", "GET", "OPTIONS"])
class DocumentSubmission(Resource):
    """Resource for managing a document submission."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Replace a document submission")
    @API.expect(create_submission_model)
    @API.response(
        code=HTTPStatus.OK, model=submission_model, description="Submission"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.require
    def patch(submission_id):
        """Replace a submission document."""
        edit_submission_data = CreateSubmissionRequestSchema().load(API.payload)
        edited_submission = SubmissionService.edit_submission_form(submission_id, edit_submission_data)
        item_id = edit_submission_data.get("item_id")
        status = edit_submission_data.get("status")
        if status:
            SubmissionService.update_submission_item_status(item_id, status)
        return SubmissionSchema().dump(edited_submission), HTTPStatus.OK
