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
# See the License for the specific language governing roles and
# limitations under the License.
"""Bring in the common JWT Manager."""
from functools import wraps
from http import HTTPStatus

from flask import g, request
from flask_jwt_oidc import JwtManager

from submit_api.models import db
from submit_api.exceptions import PermissionDeniedError
from submit_api.models import User
from submit_api.models.user import UserType
from submit_api.models.user_status import UserStatusEnum
from submit_api.utils.roles import EpicSubmitRole

jwt = (
    JwtManager()
)  # pylint: disable=invalid-name; lower case name as used by convention in most Flask apps


class Auth:  # pylint: disable=too-few-public-methods
    """Extending JwtManager to include additional functionalities."""

    @classmethod
    def require(cls, f):
        """Validate the Bearer Token."""

        @jwt.requires_auth
        @wraps(f)
        def decorated(*args, **kwargs):
            g.authorization_header = request.headers.get("Authorization", None)
            g.token_info = g.jwt_oidc_token_info

            return f(*args, **kwargs)

        return decorated

    @classmethod
    def has_one_of_staff_roles(cls, roles):
        """Check that at least one of the realm roles are in the token.

        Args:
            roles (list[str]): List of valid roles
        """
        # Always include full_access role for staff users
        roles_with_full_access = list(roles) + [EpicSubmitRole.FULL_ACCESS.value]
        return jwt.has_one_of_roles(roles_with_full_access)

    @classmethod
    def has_one_of_roles(cls, roles):
        """Check that at least one of the realm roles are in the token.

        Args:
            roles (list[str]): List of valid roles
        """

        def decorated(f):
            @Auth.require
            @wraps(f)
            def wrapper(*args, **kwargs):
                user = db.session.query(User).filter_by(auth_guid=cls().preferred_username).first()
                if user.type == UserType.STAFF:
                    # Always include full_access role for staff users
                    roles_with_full_access = list(roles) + [EpicSubmitRole.FULL_ACCESS.value]
                    # pylint: disable=no-value-for-parameter
                    if jwt.has_one_of_roles(roles_with_full_access):
                        return f(*args, **kwargs)
                    raise PermissionDeniedError("Access Denied", HTTPStatus.UNAUTHORIZED)

                # Block revoked users from accessing the system
                if user.status_id == UserStatusEnum.ACCESS_REVOKED.value:
                    raise PermissionDeniedError("Access Denied - Your access has been revoked.", HTTPStatus.FORBIDDEN)

                if not user or not user.account_user or not user.account_user.roles:
                    raise PermissionDeniedError("Access Denied", HTTPStatus.UNAUTHORIZED)
                permissions: set = set()
                for user_role in user.account_user.roles:
                    permissions.update(user_role.permissions)
                if permissions & set(roles):
                    return f(*args, **kwargs)

                raise PermissionDeniedError("Access Denied", HTTPStatus.UNAUTHORIZED)

            return wrapper

        return decorated

    @property
    def sub(self):
        """Retrieve the subject (sub) claim from the JWT token."""
        return g.token_info.get("sub") if hasattr(g, "token_info") else None

    @property
    def preferred_username(self):
        """Retrieve the preferred username claim from the JWT token."""
        return g.token_info.get("preferred_username") if hasattr(g, "token_info") else None


auth = Auth()
