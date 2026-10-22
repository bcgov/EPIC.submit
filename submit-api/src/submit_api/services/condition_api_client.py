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
"""Client for the Condition repository API."""
import requests
from flask import current_app

from submit_api.services.keycloak_token_service import KeycloakTokenService


_REQUEST_TIMEOUT = 30


class ConditionApiClient:
    """Client to fetch approved report obligations from the Condition API."""

    @staticmethod
    def get_approved_reports_by_project(epic_guid: str) -> list:
        """Return the approved reports for a project identified by its EPIC guid.

        Raises:
            ValueError: if the Condition API base URL is not configured.
            requests.RequestException: if the HTTP call fails.
        """
        base_url = current_app.config.get("CONDITION_API_BASE_URL")
        if not base_url:
            current_app.logger.error("CONDITION_API_BASE_URL is not configured.")
            raise ValueError("CONDITION_API_BASE_URL is not configured.")

        token = KeycloakTokenService.get_service_account_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        endpoint = f"{base_url}/api/reports/project/{epic_guid}"

        current_app.logger.info(f"Fetching approved reports from Condition API: {endpoint}")
        response = requests.get(endpoint, headers=headers, timeout=_REQUEST_TIMEOUT)
        response.raise_for_status()
        return (response.json() or {}).get("reports", [])
