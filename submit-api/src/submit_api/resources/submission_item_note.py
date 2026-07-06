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
"""API endpoints for managing a internal staff document resource."""

from http import HTTPStatus

from flask_cors import cross_origin
from flask_restx import Namespace, Resource, abort

from submit_api.auth import auth
from submit_api.enums.package_operation import PackageOperation
from submit_api.models import Item as ItemModel
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.submission_item_note import PostSubmissionItemNote, SubmissionItemNote
from submit_api.services.package_access_control import PackageAccessControl
from submit_api.services.submission_item_note_service import SubmissionItemNoteService
from submit_api.utils.util import allowedorigins, cors_preflight


API = Namespace("notes", description="Endpoints for staff notes")
"""Custom exception messages
"""

create_note = ApiHelper.convert_ma_schema_to_restx_model(
    API, PostSubmissionItemNote(), "Create a staff note"
)
note = ApiHelper.convert_ma_schema_to_restx_model(
    API, SubmissionItemNote(), "Staff Note"
)


@cors_preflight("OPTIONS, POST")
@API.route("/submission-items/<int:submission_item_id>", methods=["POST", "OPTIONS"])
class SubmissionItemNoteResource(Resource):
    """Resource for managing submission item notes."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a staff note")
    @API.expect(create_note)
    @API.response(
        code=HTTPStatus.CREATED, model=note, description="Created a staff note"
    )
    @API.response(HTTPStatus.NOT_FOUND, "Not found")
    @auth.require
    @cross_origin(origins=allowedorigins())
    def post(submission_item_id):
        """Create a staff note."""
        # Get the item to determine package context
        submission_item = ItemModel.find_by_id(submission_item_id)
        if not submission_item:
            abort(HTTPStatus.NOT_FOUND, "Submission item not found")

        # Check package-aware access control (mp_create, w_create, or eao_create)
        PackageAccessControl.check_package_access(
            submission_item.package_id,
            PackageOperation.CREATE
        )

        create_note_data = PostSubmissionItemNote().load(API.payload)
        created_note = SubmissionItemNoteService.create_note(submission_item_id, create_note_data)
        return SubmissionItemNote().dump(created_note), HTTPStatus.CREATED
