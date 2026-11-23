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
"""API endpoints for works synchronised from EPIC.track. Consumed by the epic-cron job."""

from http import HTTPStatus

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from submit_api.auth import auth
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.services.work_phase_sync_service import WorkPhaseSyncError, WorkPhaseSyncService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import allowedorigins, cors_preflight

API = Namespace("works", description="Endpoints for works synchronised from EPIC.track")


@cors_preflight("POST, OPTIONS")
@API.route("/<int:work_id>/phase-sync", methods=["POST", "OPTIONS"])
class WorkPhaseSync(Resource):
    """Resource that reconciles a work's packages with the work's current phase."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API, endpoint_description="Archive the work's out-of-phase packages and create its mandatory packages"
    )
    @API.response(code=HTTPStatus.OK, description="Reconcile summary")
    @API.response(HTTPStatus.NOT_FOUND, "Not Found")
    @API.response(HTTPStatus.INTERNAL_SERVER_ERROR, "A step failed; call again to complete it")
    @auth.has_one_of_staff_roles([EpicSubmitRole.EAO_CREATE.value, EpicSubmitRole.MANAGE_USERS.value])
    @cross_origin(origins=allowedorigins())
    def post(work_id):
        """Reconcile the given work's packages with its current phase."""
        try:
            summary = WorkPhaseSyncService.reconcile_work(work_id)
        except WorkPhaseSyncError as error:
            return {"message": str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR
        return summary, HTTPStatus.OK
