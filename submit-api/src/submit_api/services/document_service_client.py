"""Document Service Client."""
import requests
from flask import current_app
from submit_api.utils.user_context import UserContext
from submit_api.services.keycloak import KeycloakService


class DocumentServiceClient:
    """Document Service Client to handle communication with external document service."""

    @staticmethod
    def _get_token():
        """Get authentication token, prioritizing user context over service account."""
        try:
            # Try to get token from current user request context
            token = UserContext().bearer_token
            if token:
                return token
        except Exception:  # pylint: disable=broad-except
            # Likely outside of request context
            pass

        # Fallback to service account token
        return KeycloakService._get_admin_token()

    @classmethod
    def _get_presigned_url(cls, s3_key: str, action: str) -> str:
        url, _ = cls._get_presigned_url_with_key(s3_key, action)
        return url

    @classmethod
    def _get_presigned_url_with_key(cls, s3_key: str, action: str) -> tuple[str, str]:
        """Fetch a presigned URL and actual relative URL from the document service."""
        base_url = current_app.config.get("DOCUMENT_SERVICE_URL")
        if not base_url:
            current_app.logger.error("DOCUMENT_SERVICE_URL is not configured.")
            raise ValueError("DOCUMENT_SERVICE_URL is not configured.")

        token = cls._get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        # Based on submit-web usage: POST with relative_url and action
        payload = {
            "relative_url": s3_key,
            "action": action
        }
        params = {"public-read": "false"}

        current_app.logger.info(f"Fetching presigned {action} URL for: {s3_key}")
        response = requests.post(
            f"{base_url}/storage-operations/presigned-urls",
            json=payload,
            headers=headers,
            params=params,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        presigned_url = data.get("presigned_url")
        actual_relative_url = data.get("relative_url", s3_key)
        if not presigned_url:
            current_app.logger.error(f"Failed to get presigned URL for {s3_key}")
            raise ValueError(f"Failed to get presigned URL for {s3_key}")
            
        return presigned_url, actual_relative_url

    @classmethod
    def get_presigned_read_url(cls, s3_key: str) -> str:
        """Get a presigned URL for reading a file from S3."""
        return cls._get_presigned_url(s3_key, "GET")

    @classmethod
    def get_presigned_write_url(cls, s3_key: str) -> tuple[str, str]:
        """Get a presigned URL for writing a file to S3, returning (presigned_url, actual_s3_key)."""
        return cls._get_presigned_url_with_key(s3_key, "PUT")
        
    @classmethod
    def get_presigned_delete_url(cls, s3_key: str) -> str:
        """Get a presigned URL for deleting a file from S3."""
        return cls._get_presigned_url(s3_key, "DELETE")

    @staticmethod
    def upload_via_presigned_url(presigned_url: str, file_data: bytes):
        """Upload file content directly to S3 via a presigned URL."""
        current_app.logger.info("Uploading file data via presigned URL")
        response = requests.put(
            presigned_url,
            data=file_data,
            headers={"Content-Type": "application/octet-stream"},
            timeout=300  # Longer timeout for potential large files
        )
        response.raise_for_status()
        current_app.logger.info("Successfully uploaded file data")

    @staticmethod
    def download_via_presigned_url(presigned_url: str, local_path: str) -> str:
        """Download file content directly from S3 via a presigned URL to a local path."""
        current_app.logger.info(f"Downloading file data via presigned URL to {local_path}")
        response = requests.get(
            presigned_url,
            timeout=300,
            stream=True
        )
        response.raise_for_status()
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        current_app.logger.info(f"Successfully downloaded file to {local_path}")
        return local_path

    @staticmethod
    def delete_via_presigned_url(presigned_url: str):
        """Delete file directly from S3 via a presigned URL."""
        current_app.logger.info("Deleting file data via presigned URL")
        response = requests.delete(
            presigned_url,
            timeout=30
        )
        response.raise_for_status()
        current_app.logger.info("Successfully deleted file via presigned URL")
