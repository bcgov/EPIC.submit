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

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.submission import CreateSubmissionRequestSchema, SubmissionSchema
from submit_api.services.submission import SubmissionService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import allowedorigins, cors_preflight

API = Namespace("submissions", description="Endpoints for Submission Management")
"""Custom exception messages
"""

create_submission_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, CreateSubmissionRequestSchema(), "Create a submission"
)
submission_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, SubmissionSchema(), "Submission"
)


@cors_preflight("OPTIONS, POST, DELETE")
@API.route("/<int:submission_id>/document", methods=["POST", "OPTIONS", "DELETE"])
class DocumentSubmission(Resource):
    """Resource for managing a document submission."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Delete a document submission")
    @API.expect(create_submission_model)
    @API.response(
        code=HTTPStatus.OK, model=submission_model, description="Submission"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_staff_roles([EpicSubmitRole.EAO_EDIT.value])
    def delete(submission_id):
        """Delete a submission document."""
        deleted_submission = SubmissionService.soft_delete_submission(submission_id)
        return SubmissionSchema().dump(deleted_submission), HTTPStatus.OK
