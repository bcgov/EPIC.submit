# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Package utilities for shared operations."""
from flask import current_app

from submit_api.models import Package as PackageModel
from submit_api.models.update_request import UpdateRequestStatus
from submit_api.models.email_queue import EmailQueue as EmailQueueModel
from submit_api.models.email_queue import EntityType
from submit_api.models.item_type import SubmissionItemType
from submit_api.models.submission import SubmissionType
from submit_api.schemas.submission import CreateSubmissionRequestSchema
from submit_api.services.submission import SubmissionService


class PackageUtils:
    """Utility class for shared package operations."""

    @staticmethod
    def deactivate_update_requests(package_id, session, package=None):
        """Deactivate all update requests for the package."""
        if not package:
            package = PackageModel.find_by_id(package_id)
        current_app.logger.info(
            f"Deactivating update requests for package {package.id}.")
        update_requests = package.update_requests
        for update_request in update_requests:
            update_request.active = False
            update_request.status = UpdateRequestStatus.CLOSED.value
            session.add(update_request)
        session.flush()
        current_app.logger.info(
            f"Update requests deactivated for package {package.id}.")

    @staticmethod
    def create_email_queue(package_id, template_name):
        """Create an email queue record."""
        email_queue = EmailQueueModel(
            entity_id=package_id,
            entity_type=EntityType.PACKAGE.value,
            template_name=template_name
        )
        email_queue.save()

    @staticmethod
    def copy_contact_information_from_old_version(old_package, new_package):
        """Copy contact information from old version."""
        current_app.logger.info(
            "Copying contact information from old version.")
        old_contact_info_item = next((item for item in old_package.items
                                     if item.type.name == SubmissionItemType.CONTACT_INFORMATION.value), None)
        new_contact_info_item = next((item for item in new_package.items
                                     if item.type.name == SubmissionItemType.CONTACT_INFORMATION.value), None)
        old_submission = next((submission for submission in old_contact_info_item.submissions
                              if submission.type == SubmissionType.FORM), None)
        if not old_submission or not old_submission.submitted_form:
            current_app.logger.error(
                "Old contact information form not found and could not be copied.")
        new_submission_data = {
            'type': SubmissionType.FORM.value,
            'item_id': new_contact_info_item.id,
            'data': old_submission.submitted_form.submission_json,
            'created_by': old_submission.created_by,
        }
        new_submission_schema = CreateSubmissionRequestSchema().load(new_submission_data)
        new_submission = SubmissionService.create_submission(
            new_contact_info_item.id, new_submission_schema)
        new_submission.created_by = old_submission.created_by
        current_app.logger.info(
            "Contact information form copied from old version.")
