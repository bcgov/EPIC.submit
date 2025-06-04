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

Test Utility for creating model factory.
"""
import random
import string

from faker import Faker
from flask import g

from src.submit_api.config import get_named_config
from submit_api.models import db
from submit_api.models.project import Project
from submit_api.models.account import Account
from submit_api.models.account_project import AccountProject
from submit_api.models.invitations import Invitations
from submit_api.models.invitations import InvitationStatus

CONFIG = get_named_config("testing")
fake = Faker()

JWT_HEADER = {
    "alg": CONFIG.JWT_OIDC_TEST_ALGORITHMS,
    "typ": "JWT",
    "kid": CONFIG.JWT_OIDC_TEST_AUDIENCE,
}


def set_global_tenant(tenant_id=1):
    """Set the global tenant id."""
    g.tenant_id = tenant_id


def factory_auth_header(jwt, claims):
    """Produce JWT tokens for use in tests."""
    return {
        "Authorization": "Bearer " + jwt.create_jwt(claims=claims, header=JWT_HEADER)
    }


def generate_abbreviation(number_of_characters):
    """Create abbreviation with given number of characters."""
    return "".join(random.choices(string.ascii_uppercase, k=number_of_characters))


def factory_project_model(name="Test Project", proponent_id=1234, proponent_name="Test Proponent"):
    project = Project(
        name=name,
        proponent_id=proponent_id,
        proponent_name=proponent_name,
        ea_certificate=None,
        epic_guid=None
    )
    db.session.add(project)
    db.session.commit()
    return project


def factory_account_model(proponent_id=1234):
    account = Account(proponent_id=proponent_id)
    db.session.add(account)
    db.session.commit()
    return account


def factory_account_project_model(account_id, project_id):
    account_project = AccountProject(account_id=account_id, project_id=project_id)
    db.session.add(account_project)
    db.session.commit()
    return account_project


def factory_project_with_proponent(**kwargs):
    project = Project(
        name=kwargs.get("name", fake.company()),
        proponent_id=kwargs.get("proponent_id", fake.random_int(min=1000, max=9999)),
        proponent_name=kwargs.get("proponent_name", fake.company()),
        ea_certificate=kwargs.get("ea_certificate", fake.uuid4()),
        epic_guid=kwargs.get("epic_guid", fake.uuid4()),
    )
    db.session.add(project)
    db.session.commit()
    return project


def factory_invitation_model(account_id, status=InvitationStatus.PENDING.value, project_ids=None, package_ids=None,
                             email=None, role_id=None):
    """Create and return a mock invitation entry."""
    invitation = Invitations(
        account_id=account_id,
        token=fake.uuid4(),
        project_ids=project_ids or [1],
        package_ids=package_ids or [],
        email=email or fake.email(),
        status=status,
        role_id=role_id
    )
    db.session.add(invitation)
    db.session.commit()
    return invitation
