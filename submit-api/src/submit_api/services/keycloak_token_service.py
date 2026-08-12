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
"""Keycloak service account token retrieval.

This module provides client_credentials token retrieval for service-to-service
authentication (e.g., calling the document service). It does NOT handle user or
group management — those operations go through epic.auth.
"""

import requests
from flask import current_app


class KeycloakTokenService:
    """Minimal Keycloak client for obtaining service account tokens."""

    @staticmethod
    def get_service_account_token() -> str:
        """Obtain a service account token via client_credentials grant.

        Returns:
            str: The access token string.
        """
        config = current_app.config
        base_url = config.get("KEYCLOAK_BASE_URL")
        realm = config.get("KEYCLOAK_REALM_NAME")
        admin_client_id = config.get("SERVICE_ACCOUNT_ID")
        admin_secret = config.get("SERVICE_ACCOUNT_SECRET")
        timeout = int(config.get("CONNECT_TIMEOUT", 60))
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        token_url = (
            f"{base_url}/auth/realms/{realm}/protocol/openid-connect/token"
        )

        response = requests.post(
            token_url,
            data=(
                f"client_id={admin_client_id}"
                f"&grant_type=client_credentials"
                f"&client_secret={admin_secret}"
            ),
            headers=headers,
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json().get("access_token")
