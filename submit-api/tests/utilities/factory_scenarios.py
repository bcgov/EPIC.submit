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
"""Test Utils.

Test Utility for creating test scenarios.
"""

from faker import Faker
from enum import Enum

from src.submit_api.config import get_named_config


fake = Faker()

CONFIG = get_named_config('testing')


class TestJwtClaims(dict, Enum):
    """Test scenarios of jwt claims."""

    no_role = {
        'iss': CONFIG.JWT_OIDC_TEST_ISSUER,
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302065',
        'firstname': fake.first_name(),
        'lastname': fake.last_name(),
        'preferred_username': fake.user_name(),
        "aud": "epic-submit",
        'realm_access': {
            'roles': [
            ]
        }
    }

    public_user_role = {
        'iss': CONFIG.JWT_OIDC_TEST_ISSUER,
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        "aud": "epic-submit",
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'preferred_username': fake.user_name(),
        'email': fake.email(),
        'tenant_id': 1,
        'realm_access': {
            'roles': [
                'public_user'
            ]
        }
    }

    staff_admin_role = {
        'iss': CONFIG.JWT_OIDC_TEST_ISSUER,
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'idp_userid': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'preferred_username': f'{fake.user_name()}@idir',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'tenant_id': 1,
        'email': 'staff@gov.bc.ca',
        'identity_provider': 'IDIR',
        "aud": CONFIG.JWT_OIDC_AUDIENCE,  # usually "epic-submit"
        'realm_access': {
            'roles': [
                'staff',
                'view_engagement',
                'create_engagement',
                'edit_engagement',
                'create_survey',
                'view_users',
                'view_private_engagements',
                'create_admin_user',
                'view_all_surveys'
            ]
        },
        'resource_access': {
            CONFIG.JWT_OIDC_AUDIENCE: {
                'roles': [
                    'eao_view'  # ✅ This is critical
                ]
            }
        }
    }
