"""Service for integrating with the Common Hosted Email Service."""
import base64
import json
from datetime import datetime, timedelta

import requests
from flask import current_app

from submit_api.data_classes.email_details import EmailDetails
from submit_api.utils.template import Template


class ChesApiService:
    """CHES api Service class."""

    def __init__(self):
        """Initiate class."""
        self.token_endpoint = current_app.config.get('CHES_TOKEN_ENDPOINT')
        self.service_client_id = current_app.config.get('CHES_CLIENT_ID')
        self.service_client_secret = current_app.config.get('CHES_CLIENT_SECRET')
        self.ches_base_url = current_app.config.get('CHES_BASE_URL')
        print(f'Initialized ChesApiService with CHES_BASE_URL: {self.ches_base_url}')
        print(f'Initialized ChesApiService with endpoint: {self.token_endpoint}, client ID: {self.service_client_id}')
        self.access_token, self.token_expiry = self._get_access_token()

    def _get_access_token(self):
        """Retrieve access token from CHES."""
        basic_auth_encoded = base64.b64encode(
            bytes(f'{self.service_client_id}:{self.service_client_secret}', 'utf-8')
        ).decode('utf-8')
        data = 'grant_type=client_credentials'
        print(f'Fetching access token from: {self.token_endpoint}')

        try:
            response = requests.post(
                self.token_endpoint,
                data=data,
                headers={
                    'Authorization': f'Basic {basic_auth_encoded}',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout=10
            )
            print(f'Response status from token endpoint: {response.status_code}')
            response.raise_for_status()

            response_json = response.json()
            print(f'Access token response JSON: {response_json}')

            expires_in = response_json['expires_in']
            expiry_time = datetime.now() + timedelta(seconds=expires_in)
            print(f'Access token expires at: {expiry_time}')

            return response_json['access_token'], expiry_time
        except requests.exceptions.RequestException as e:
            print(f'Error occurred while fetching access token: {str(e)}')
            if e.response is not None:
                print(f'Status Code: {e.response.status_code}')
                print(f'Response Content: {e.response.text}')
            else:
                print("No response received from server.")
            raise  # Re-raise the exception to propagate the error

    def _ensure_valid_token(self):
        """Ensure the current access token is valid; refresh if expired."""
        print(f'Checking token validity at: {datetime.now()}, expiry: {self.token_expiry}')

        if datetime.now() >= self.token_expiry:
            print('Token expired, fetching new token...')
            self.access_token, self.token_expiry = self._get_access_token()
        else:
            print('Token is still valid.')

    @staticmethod
    def _get_email_body_from_template(template_name: str, body_args: dict):
        """Get email body from a template."""
        if not template_name:
            raise ValueError('Template name is required')
        print(f'Fetching template with name: {template_name}')

        template = Template.get_template(template_name)
        if not template:
            raise ValueError('Template not found')

        rendered_body = template.render(body_args)
        print(f'Rendered email body from template: {rendered_body}')

        return rendered_body

    def _get_email_body(self, email_details: EmailDetails):
        """Get email body based on details or template."""
        if email_details.body:
            body = email_details.body
            body_type = 'text'
            print('Using provided email body')
        else:
            print('No body provided, rendering from template')
            body = self._get_email_body_from_template(email_details.template_name,
                                                      email_details.body_args)
            body_type = 'html'

        print(f'Email body type: {body_type}, body content: {body}')
        return body, body_type

    def send_email(self, email_details: EmailDetails):
        """Generate document based on template and data."""
        self._ensure_valid_token()

        body, body_type = self._get_email_body(email_details)

        request_body = {
            'bodyType': body_type,
            'body': body,
            'subject': email_details.subject,
            'from': email_details.sender,
            'to': email_details.recipients,
            'cc': email_details.cc,
            'bcc': email_details.bcc
        }
        json_request_body = json.dumps(request_body)

        print(f'Request body for sending email: {json_request_body}')

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.access_token}'
        }

        url = f'{self.ches_base_url}/api/v1/email'
        print(f'Sending email to CHES at URL: {url} with headers: {headers}')

        try:
            response = requests.post(url, data=json_request_body, headers=headers, timeout=10)
            print(f'Response status from CHES email endpoint: {response.status_code}')
            response.raise_for_status()

            response_json = response.json()
            print(f'Response JSON from CHES email endpoint: {response_json}')
            return response_json, response.status_code
        except requests.exceptions.RequestException as e:
            # Print detailed error information
            print(f'Error occurred while sending email: {str(e)}')
            if e.response is not None:
                print(f'Status Code: {e.response.status_code}')
                print(f'Response Content: {e.response.text}')
            else:
                print("No response received from server.")
            raise  # Re-raise the exception to propagate the error
