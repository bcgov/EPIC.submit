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
    'Management Plan': 'EAO.ManagementPlanSupport@gov.bc.ca',
    'IEM': 'EAO.ManagementPlanSupport@gov.bc.ca',
}

SUBMISSION_PACKAGE_TYPE_SENDER_MAP = {
    'Management Plan': 'The Management Plan Team at the Environmental Assessment Office',
    'IEM': 'EAO.ManagementPlanSupport@gov.bc.ca',
}

# Package types accessible via MP_VIEW role
# Add new package types here when they should be accessible to users with mp_view permission
MP_VIEW_PACKAGE_TYPES = [
    'Management Plan',
    'IEM',
]

# Role-to-operation mappings for MP-type packages
# Note: Roles do NOT stack - each must be granted explicitly
# Users need multiple roles for multiple operations (e.g., mp_view + mp_edit)
MP_ROLE_OPERATIONS = {
    'mp_view': ['read'],
    'mp_edit': ['edit'],  # Does NOT include read
    'mp_create': ['create'],  # Does NOT include read or edit
    'mp_extended_edit': ['approve'],  # Manager-level approval
}

# Role-to-operation mappings for work packages (includes Additional Information)
# Note: Roles do NOT stack - each must be granted explicitly
W_ROLE_OPERATIONS = {
    'w_view': ['read'],
    'w_edit': ['edit'],  # Does NOT include read
    'w_create': ['create'],  # Does NOT include read or edit
    'w_extended_edit': ['approve'],  # Team Lead approval
}

# Keycloak group mappings for staff work role assignments
STAFF_WORK_ROLE_KEYCLOAK_GROUPS = {
    'TEAM_LEAD': 'SUBMIT/OPS_TEAM_LEAD',
    'TEAM_MEMBER': 'SUBMIT/OPS_TEAM_MEMBER'
}

# Item type name for GIS/Geospatial submissions
GIS_ITEM_TYPE_NAME = "Geospatial Information"

MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_TEMPLATE = 'management_plan_submission_verification.html'
MANAGEMENT_PLAN_SUBMISSION_CONFIRMATION_EMAIL_SUBJECT = 'Management Plan Submission Confirmation'
MANAGEMENT_PLAN_UPDATE_REQUEST_CREATED_EMAIL_TEMPLATE = 'update_request_created.html'
NEW_USER_INVITATION_ACCOUNT_ADMIN_EMAIL_TEMPLATE = 'new_user_invitation_account_admin.html'
NEW_USER_INVITATION_PROJECT_ADMIN_EMAIL_TEMPLATE = 'new_user_invitation_project_admin.html'
NEW_USER_INVITATION_COLLABORATOR_EMAIL_TEMPLATE = 'new_user_invitation_collaborator.html'
MANAGEMENT_PLAN_SUBMISSION_NOTIFY_STAFF_EMAIL_TEMPLATE = 'submission_notify_staff.html'
SUBMISSION_AWAITING_MANAGER_APPROVAL_EMAIL_TEMPLATE = 'submission_awaiting_manager_approval.html'
MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE = 'management_plan_resubmission_request.html'
SUBMISSION_WITHDRAWN_CONFIRMATION_EMAIL_TEMPLATE = 'submission_withdrawn_confirmation.html'
SUBMISSION_ACKNOWLEDGED_CONFIRMATION_EMAIL_TEMPLATE = 'submission_acknowledgement.html'
