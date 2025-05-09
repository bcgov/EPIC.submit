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
"""This module contains constants used in the application."""

SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP = {
    'Management Plan': 'EAO.ManagementPlanSupport@gov.bc.ca'
}

MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE = 'management_plan_submission_verification.html'
MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_SUBJECT = 'Management Plan Submission Confirmation'
MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE = 'management_plan_update_request_created.html'
NEW_USER_INVITATION_EMAIL_TEMPLATE = 'new_user_invitation.html'
MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE = 'management_plan_submission_notify_staff.html'