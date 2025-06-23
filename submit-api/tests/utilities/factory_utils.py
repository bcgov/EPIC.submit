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
from submit_api.enums.item_status import ItemStatus
from submit_api.models import db, Item, ItemType
from submit_api.models.account import Account
from submit_api.models.account_project import AccountProject
from submit_api.models.invitations import InvitationStatus
from submit_api.models.invitations import Invitations
from submit_api.models.project import Project
from submit_api.models.user import UserType

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
    """Factory project model."""
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
    """Factory account model."""
    account = Account(proponent_id=proponent_id)
    db.session.add(account)
    db.session.commit()
    return account


def factory_user_model(auth_guid=None, user_type=UserType.STAFF, session=None):
    """Factory user model."""
    from submit_api.models.user import User

    user = User(
        auth_guid=auth_guid or fake.uuid4(),
        type=user_type,
        status_id=1
    )
    if session:
        session.add(user)
        session.flush()
    else:
        user.save()
    return user


def factory_account_project_model(account_id, project_id):
    """Factory account project model."""
    account_project = AccountProject(account_id=account_id, project_id=project_id)
    db.session.add(account_project)
    db.session.commit()
    return account_project


def factory_project_with_proponent(**kwargs):
    """Factory project."""
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


def factory_item_type_model(name=None, code=None):
    """Factory item type model."""
    item_type = ItemType(
        name=name or fake.word().capitalize(),
        code=code or fake.lexify(text="???")
    )
    db.session.add(item_type)
    db.session.commit()
    return item_type


def factory_item_model(package=None, item_type_id=1, status="NEW", submitted_by=None):
    """Factory item model using hardcoded item_type_id."""
    package = package or factory_package_model()

    item = Item(
        package_id=package.id,
        type_id=item_type_id,  # e.g., 1 = Contact Information Form
        status=ItemStatus[status],
        submitted_by=submitted_by or fake.email()
    )
    db.session.add(item)
    db.session.commit()
    return item


def factory_package_model(account_project=None, name=None, status=None, package_type_id=1):
    """Factory package model using hardcoded package_type_id."""
    from submit_api.models.package import Package, PackageStatus

    if not account_project:
        account = factory_account_model()
        project = factory_project_model()
        account_project = factory_account_project_model(account.id, project.id)

    package = Package(
        account_project_id=account_project.id,
        name=name or fake.sentence(nb_words=3),
        type_id=package_type_id,  # Hardcoded ID from seeded data (e.g., 1 = "Management Plan")
        status=status or [PackageStatus.NEW.value]
    )
    db.session.add(package)
    db.session.commit()
    return package
