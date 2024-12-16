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

from flask_restx import Namespace, Resource, cors

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.schemas.internal_staff_document import InternalStaffDocument, PostInternalStaffDocument
from submit_api.services.internal_staff_document_service import InternalStaffDocumentService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import cors_preflight


API = Namespace("internal-staff-documents", description="Endpoints for Internal Staff Document Management")
"""Custom exception messages
"""

create_internal_document = ApiHelper.convert_ma_schema_to_restx_model(
    API, PostInternalStaffDocument(), "Create an internal staff document"
)
internal_document = ApiHelper.convert_ma_schema_to_restx_model(
    API, InternalStaffDocument(), "Internal Staff Document"
)


@cors_preflight("OPTIONS, POST")
@API.route("/submission-items/<int:submission_item_id>", methods=["POST", "OPTIONS"])
class InternalStaffDocuments(Resource):
    """Resource for managing projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create an internal staff document")
    @API.expect(create_internal_document)
    @API.response(
        code=HTTPStatus.CREATED, model=internal_document, description="Created Internal Staff Document"
    )
    @API.response(HTTPStatus.NOT_FOUND, "Not found")
    @auth.has_one_of_roles([EpicSubmitRole.EAO_CREATE])
    @cors.crossdomain(origin="*")
    def post(submission_item_id):
        """Create an internal staff document."""
        create_document_data = PostInternalStaffDocument().load(API.payload)
        created_document = (InternalStaffDocumentService
                            .create_internal_staff_document(submission_item_id, create_document_data))
        return InternalStaffDocument().dump(created_document), HTTPStatus.CREATED
