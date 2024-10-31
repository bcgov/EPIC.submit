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
from enum import Enum

class SubmissionConstants(Enum):
    # Package Types
    MANAGEMENT_PLAN = 'Management Plan'
    
    # Email Templates
    MANAGEMENT_PLAN_SUBMISSION_TEMPLATE = 'management_plan_submission_verification.html'
    
    # Email Subjects
    MANAGEMENT_PLAN_SUBMISSION_SUBJECT = 'Management Plan Submission Confirmation'
    
    # Email Senders
    MANAGEMENT_PLAN_SENDER = 'EAO.ManagementPlanSupport@gov.bc.ca'

# Map submission package types to their corresponding email senders
SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP = {
    SubmissionConstants.MANAGEMENT_PLAN.value: SubmissionConstants.MANAGEMENT_PLAN_SENDER.value
}


class EmailConstants(Enum):
    """Constants for emails."""
    PENDING = 'PENDING'
    SENT = 'SENT'
    FAILED = 'FAILED'

class NotificationEntity(Enum):
    """Enum for entity types that can have associated emails."""
    PACKAGE = 'PACKAGE'
