"""Scenarios for different token claims."""

from enum import Enum

from faker import Faker

from src.submit_api.config import get_named_config


fake = Faker()
CONFIG = get_named_config("testing")


class TokenJWTClaims(dict, Enum):
    """Token claims."""

    default = {
        "iss": CONFIG.JWT_OIDC_TEST_ISSUER,
        "sub": "f7a4a1d3-73a8-4cbc-a40f-bb1145302065",
        "firstname": fake.first_name(),
        "lastname": fake.last_name(),
        "preferred_username": fake.user_name(),
        "groups": ["/COMPLIANCE/VIEWER"],
        "realm_access": {"roles": []},
    }

    STAFF_EAO_VIEW = {
        "iss": CONFIG.JWT_OIDC_TEST_ISSUER,
        "sub": "b8a4a1d3-73a8-4cbc-a40f-bb1145302066", # Unique sub
        "firstname": "StaffView",
        "lastname": "User",
        "preferred_username": "staffview",
        "groups": ["/EAO/ROLE_MAPPER"], # Typical group for staff
        "realm_access": {"roles": ["eao_view"]},
    }

    STAFF_EAO_CREATE = {
        "iss": CONFIG.JWT_OIDC_TEST_ISSUER,
        "sub": "c9a4a1d3-73a8-4cbc-a40f-bb1145302067", # Unique sub
        "firstname": "StaffCreate",
        "lastname": "User",
        "preferred_username": "staffcreate",
        "groups": ["/EAO/ROLE_MAPPER"], # Typical group for staff
        "realm_access": {"roles": ["eao_create", "eao_edit"]}, # Create usually implies edit/view
    }

    STAFF_EAO_EDIT = {
        "iss": CONFIG.JWT_OIDC_TEST_ISSUER,
        "sub": "d0a4a1d3-73a8-4cbc-a40f-bb1145302068", # Unique sub
        "firstname": "StaffEdit",
        "lastname": "User",
        "preferred_username": "staffedit",
        "groups": ["/EAO/ROLE_MAPPER"], # Typical group for staff
        "realm_access": {"roles": ["eao_edit", "eao_view"]}, # Edit usually implies view
    }

    # Proponent for creating initial packages
    PROPONENT_CREATE_BASIC = {
        "iss": CONFIG.JWT_OIDC_TEST_ISSUER,
        "sub": "e1a4a1d3-73a8-4cbc-a40f-bb1145302069", # Unique sub
        "firstname": "Proponent",
        "lastname": "User",
        "preferred_username": "proponentbasic",
        "groups": ["/PROPONENT/MYPROPONENT_BASIC"], # Example proponent group
        "realm_access": {"roles": ["proponent_create"]},
    }
