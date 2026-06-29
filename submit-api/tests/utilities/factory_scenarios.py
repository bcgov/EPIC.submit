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

from enum import Enum

from faker import Faker

from src.submit_api.config import get_named_config
from submit_api.utils.roles import EpicSubmitRole


fake = Faker()

CONFIG = get_named_config('testing')


class TestJwtClaims(dict, Enum):
    """Test scenarios of jwt claims."""

    staff_admin_role = {
        'iss': CONFIG.JWT_OIDC_TEST_ISSUER,
        'sub': 'f7a4a1d4-73a8-4cbc-a40f-bb1145302065',
        'idp_userid': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302065',
        'preferred_username': f'{fake.user_name()}@idir',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'tenant_id': 1,
        'email': fake.email(),
        'identity_provider': 'IDIR',
        "aud": CONFIG.JWT_OIDC_TEST_AUDIENCE,  # usually "epic-submit"
        'realm_access': {
            'roles': [
                EpicSubmitRole.EAO_CREATE.value,
                EpicSubmitRole.EAO_EDIT.value,
                EpicSubmitRole.EAO_VIEW.value,
                EpicSubmitRole.MANAGE_USERS.value,
                EpicSubmitRole.EXTENDED_EAO_EDIT.value,
                EpicSubmitRole.FULL_ACCESS.value,
            ]
        },
        'resource_access': {
            CONFIG.JWT_OIDC_TEST_AUDIENCE: {
                'roles': [
                    'eao_view'
                ]
            }
        }
    }

    proponent_role = {
        'iss': CONFIG.JWT_OIDC_TEST_ISSUER,
        'sub': '12345678-aaaa-bbbb-cccc-1234567890ab',  # Unique for this proponent
        'idp_userid': '12345678-aaaa-bbbb-cccc-1234567890ab',
        'preferred_username': f'{fake.user_name()}@example.com',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'tenant_id': 1,
        'email': 'testproponent@example.com',
        'identity_provider': 'bceidbusiness',  # simulate proponent (BCEID or similar)
        'aud': CONFIG.JWT_OIDC_TEST_AUDIENCE,
        'realm_access': {
            'roles': []  # not used for proponent permission check
        },
        'resource_access': {
            CONFIG.JWT_OIDC_TEST_AUDIENCE: {
                'roles': []  # not used for proponent
            }
        }
    }


class TestPackageScenarios:
    """Common test scenarios and payloads related to package creation."""

    PLAN_NAME = "Health and Medical Services Plan"
    EXPECTED_PARTIES = ["NHA", "Xatsull First Nation"]
    CONDITION_NUMBER = 17
    TYPE_NAME = "Management Plan"

    @staticmethod
    def get_payload(
            plan_name=PLAN_NAME,
            parties=EXPECTED_PARTIES,
            condition_number=CONDITION_NUMBER,
            type_name=TYPE_NAME
    ):
        """Return a standard package creation payload."""
        return {
            "name": plan_name,
            "metadata": {
                "main_condition": {
                    "condition_attributes": {
                        "deliverable_name": [plan_name],
                        "parties_required_to_be_consulted": parties,
                        "requires_consultation": "true",
                        "requires_management_plan": "true",
                        "submitted_to_eao_for": "Satisfaction",
                        "time_associated_with_submission_milestone": "90"
                    },
                    "condition_name": plan_name,
                    "condition_number": condition_number,
                    "condition_text": f"{condition_number}.1 The Holder must ...",
                    "plan_name": plan_name
                },
                "supporting_conditions": []
            },
            "type": type_name
        }

    @staticmethod
    def get_contact_info_submission_payload(item_id: int):
        """Return a sample contact information form submission payload."""
        return {
            "type": "FORM",
            "status": "COMPLETED",
            "item_id": item_id,
            "data": {
                "primaryContact": {
                    "givenName": fake.first_name(),
                    "surname": fake.last_name(),
                    "company": fake.company(),
                    "position": fake.job(),
                    "workPhoneNumber": fake.phone_number(),
                    "workEmailAddress": fake.email()
                },
                "secondaryContact": {
                    "givenName": fake.first_name(),
                    "surname": fake.last_name(),
                    "company": fake.company(),
                    "position": fake.job(),
                    "workPhoneNumber": fake.phone_number(),
                    "workEmailAddress": fake.email()
                }
            }
        }

    @staticmethod
    def get_fake_document_payload():
        """Get doc payload."""
        return {
            "type": "DOCUMENT",
            "data": {
                "name": fake.file_name(extension="pdf"),
                "url": fake.file_path(depth=3, extension="pdf").replace("\\", "/"),
                "folder": fake.word()
            }
        }

    @staticmethod
    def get_consultation_record_form_payload(item_id: int) -> dict:
        """Returns a fake form payload for Consultation Record(s)."""
        return {
            "item_id": item_id,
            "type": "FORM",
            "version": "1.1",
            "submission_json": {
                "allPartiesConsulted": True,
                "consultedParties": [fake.company() for _ in range(2)],
                "notes": fake.paragraph(nb_sentences=2),
                "planWasReviewed": True,
                "writtenExplanationsProvidedToCommenters": True,
                "writtenExplanationsProvidedToParties": True,
            },
        }

    @staticmethod
    def get_management_plan_form_payload(item_id: int) -> dict:
        """Returns a fake form payload for Management Plan."""
        return {
            "item_id": item_id,
            "type": "FORM",
            "version": "1.1",
            "submission_json": {
                "allRequirementsAddressed": True,
                "conditionSatisfied": True,
                "informationAccurate": True,
                "notes": fake.sentence(nb_words=10),
            },
        }
