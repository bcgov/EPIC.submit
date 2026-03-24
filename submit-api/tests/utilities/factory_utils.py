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

from datetime import datetime, timedelta, timezone
import random
import string

from faker import Faker
from flask import g

from src.submit_api.config import get_named_config
from submit_api.enums.item_status import ItemStatus
from submit_api.enums.role import RoleEnum
from submit_api.models import (
    AccountUser,
    Item,
    ItemType,
    PackageVersion,
    Role,
    Submission,
    SubmittedForm,
    User,
    UserRole,
    db,
)
from submit_api.models.account import Account
from submit_api.models.account_project import AccountProject
from submit_api.models.invitations import Invitations, InvitationStatus
from submit_api.models.project import Project
from submit_api.models.proponent import Proponent
from submit_api.models.submission import SubmissionStatus, SubmissionType
from submit_api.models.track_phase import TrackPhase
from submit_api.models.track_work import TrackWork
from submit_api.models.user import UserType

from tests.utilities.factory_scenarios import TestJwtClaims

CONFIG = get_named_config("testing")
fake = Faker()

JWT_HEADER = {
    "alg": CONFIG.JWT_OIDC_TEST_ALGORITHMS,
    "typ": "JWT",
    "kid": CONFIG.JWT_OIDC_TEST_AUDIENCE,
}


def set_global_token_info(token_info=None):
    """Set the global token info."""
    if token_info is None:
        token_info = TestJwtClaims.staff_admin_role
    g.jwt_oidc_token_info = token_info


def factory_auth_header(jwt, claims):
    """Produce JWT tokens for use in tests."""
    return {
        "Authorization": "Bearer " + jwt.create_jwt(claims=claims, header=JWT_HEADER)
    }


def generate_abbreviation(number_of_characters):
    """Create abbreviation with given number of characters."""
    return "".join(random.choices(string.ascii_uppercase, k=number_of_characters))


def factory_project_model(name="Test Project", proponent_id=1234):
    """Create a project model."""
    existing_proponent = Proponent.query.filter_by(id=proponent_id).first()
    if not existing_proponent:
        proponent = Proponent(
            id=proponent_id, name=f"Test Proponent {proponent_id}", is_deleted=False
        )
        db.session.add(proponent)
        db.session.flush()

    project = Project(
        name=name, proponent_id=proponent_id, ea_certificate=None, epic_guid=None
    )
    db.session.add(project)
    db.session.commit()
    return project


def factory_account_model(proponent_id=1234):
    """Create an account model."""
    existing_proponent = Proponent.query.filter_by(id=proponent_id).first()
    if not existing_proponent:
        proponent = Proponent(
            id=proponent_id, name=f"Test Proponent {proponent_id}", is_deleted=False
        )
        db.session.add(proponent)
        db.session.flush()

    account = Account(proponent_id=proponent_id)
    db.session.add(account)
    db.session.commit()
    return account


def factory_proponent_model(
    id=None, name="Test Proponent", status=None, is_deleted=False
):
    """Create a proponent model."""
    if id is None:
        id = fake.random_int(min=1000, max=999999)
    existing_proponent = Proponent.query.filter_by(id=id).first()
    if existing_proponent:
        # Update existing proponent with provided values
        existing_proponent.name = name
        if status is not None:
            existing_proponent.status = status
        existing_proponent.is_deleted = is_deleted
        db.session.commit()
        return existing_proponent
    proponent = Proponent(id=id, name=name, status=status, is_deleted=is_deleted)
    db.session.add(proponent)
    db.session.commit()
    return proponent


def factory_user_model(auth_guid=None, user_type=UserType.STAFF, session=None):
    """Create a user model."""
    from submit_api.models.user import User

    user = User(auth_guid=auth_guid or fake.uuid4(), type=user_type, status_id=1)
    if session:
        session.add(user)
        session.flush()
    else:
        user.save()
    return user


def factory_account_project_model(account_id, project_id):
    """Create an account project model."""
    account_project = AccountProject(account_id=account_id, project_id=project_id)
    db.session.add(account_project)
    db.session.commit()
    return account_project


def factory_project_with_proponent(**kwargs):
    """Create a project with proponent."""
    proponent_id = kwargs.get("proponent_id", fake.random_int(min=1000, max=9999))
    existing_proponent = Proponent.query.filter_by(id=proponent_id).first()
    if not existing_proponent:
        proponent = Proponent(
            id=proponent_id, name=f"Test Proponent {proponent_id}", is_deleted=False
        )
        db.session.add(proponent)
        db.session.flush()

    project = Project(
        name=kwargs.get("name", fake.company()),
        proponent_id=proponent_id,
        ea_certificate=kwargs.get("ea_certificate", fake.uuid4()),
        epic_guid=kwargs.get("epic_guid", fake.uuid4()),
        has_approved_condition=kwargs.get("has_approved_condition", True),
    )
    db.session.add(project)
    db.session.commit()
    return project


def factory_invitation_model(
    account_id,
    project_ids=[1],
    package_ids=[],
    token=fake.uuid4(),
    email=fake.email(),
    status=InvitationStatus.PENDING.value,
    expiry_date=datetime.now(timezone.utc) + timedelta(days=7),
    role_id=None,
    is_first_time=False,
):
    """Create and return a mock invitation entry."""
    if role_id is None:
        role = Role.get_by_name(RoleEnum.PROJECT_ADMIN.value)
        role_id = role.id if role else None

    invitation = Invitations(
        account_id=account_id,
        project_ids=project_ids,
        package_ids=package_ids,
        token=token,
        email=email,
        status=status,
        expiry_date=expiry_date,
        role_id=role_id,
        is_first_time=is_first_time,
    )
    db.session.add(invitation)
    db.session.commit()
    return invitation


def factory_item_type_model(name=None, code=None):
    """Create an item type model."""
    item_type = ItemType(
        name=name or fake.word().capitalize(), code=code or fake.lexify(text="???")
    )
    db.session.add(item_type)
    db.session.commit()
    return item_type


def factory_item_model(package=None, item_type_id=1, status="NEW", submitted_by=None):
    """Create an item model using hardcoded item_type_id."""
    package = package or factory_package_model()

    item = Item(
        package_id=package.id,
        type_id=item_type_id,  # e.g., 1 = Contact Information Form
        status=ItemStatus[status],
        submitted_by=submitted_by or fake.email(),
    )
    db.session.add(item)
    db.session.commit()
    return item


def factory_package_model(
    account_project=None,
    name=None,
    status=None,
    package_type_id=1,
    original_package_id=None,
    version=1,
    submitted_to_eao_for=None,
):
    """Create a package model using hardcoded package_type_id."""
    from submit_api.models.package import Package, PackageStatus

    if not account_project:
        account = factory_account_model()
        project = factory_project_model()
        account_project = factory_account_project_model(account.id, project.id)

    package = Package(
        account_project_id=account_project.id,
        name=name or fake.sentence(nb_words=3),
        type_id=package_type_id,  # Hardcoded ID from seeded data (e.g., 1 = "Management Plan")
        status=status or [PackageStatus.NEW.value],
    )
    db.session.add(package)
    db.session.flush()

    package_version = create_package_version(package, original_package_id, version)
    package.version_id = package_version.id
    db.session.add(package)

    factory_package_metadata_model(
        package.id, submitted_to_eao_for=submitted_to_eao_for
    )

    db.session.flush()
    db.session.commit()
    return package


def factory_package_metadata_model(
    package_id, metadata: dict = None, submitted_to_eao_for=None
):
    """Create a package metadata model."""
    from submit_api.models.package_metadata import PackageMetadata

    if not metadata:
        metadata = {
            "cc_completed_on": fake.iso8601(),
            "cc_start_date": fake.iso8601(),
            "main_condition": {
                "condition_name": "Construction Environmental Management Plan",
                "condition_number": fake.random_int(1),
                "condition_text": fake.text(max_nb_chars=500),
                "condition_attributes": {
                    "deliverable_name": ["Construction Environmental Management Plan"],
                    "milestone_related_to_plan_submission": "Construction",
                    "milestones_related_to_plan_implementation": ["Operations"],
                    "parties_required_to_be_consulted": [
                        "Participating Indigenous Nations",
                        "EMLI",
                        "ENV",
                        "NHA",
                        "MOF",
                    ],
                    "requires_consultation": "true",
                    "requires_iem_terms_of_engagement": "true",
                    "requires_management_plan": "true",
                    "submitted_to_eao_for": submitted_to_eao_for or "Satisfaction",
                    "time_associated_with_submission_milestone": "60",
                },
            },
            "supporting_conditions": [],
            "review_completed_on": fake.iso8601(),
            "review_start_date": fake.iso8601(),
        }
    package_metadata = PackageMetadata(
        package_id=package_id,
        json={
            **metadata,
        },
    )
    db.session.add(package_metadata)
    db.session.flush()
    return package_metadata


def create_package_version(package, original_package_id=None, version=1):
    """Create and return a package version."""
    package_version = PackageVersion(
        version=version, original_package_id=original_package_id or package.id
    )
    db.session.add(package_version)
    db.session.flush()
    return package_version


def create_proponent_with_role(
    session,
    *,
    auth_guid: str,
    account_id: int,
    role_name: str = RoleEnum.PROJECT_ADMIN.value,
    account_project_id: int = None,
):
    """Create a test proponent user with account and role."""
    user = User.create_user(
        {"auth_guid": auth_guid, "type": UserType.PROPONENT}, session=session
    )

    account_user = AccountUser.create_account_user(
        {
            "account_id": account_id,
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
            "position": fake.job(),
            "work_email_address": fake.email(),
            "work_contact_number": fake.phone_number(),
            "user_id": user.id,
        },
        session=session,
    )

    role = Role.get_by_name(role_name)

    user_role = UserRole.create_user_role(
        {
            "account_user_id": account_user.id,
            "role_id": role.id,
            "package_ids": None,
            "account_project_id": account_project_id,
        },
        session=session,
    )

    return user, account_user, user_role


def setup_authenticated_proponent(session, jwt, role=RoleEnum.PROJECT_ADMIN.value):
    """Set up authenticated proponent with headers and account_project."""
    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    auth_guid = fake.uuid4()
    user, account_user, _ = create_proponent_with_role(
        session,
        auth_guid=auth_guid,
        account_id=account.id,
        role_name=role,
        account_project_id=account_project.id,
    )

    session.flush()

    claims = TestJwtClaims.proponent_role.copy()
    claims["preferred_username"] = auth_guid
    claims["email"] = account_user.work_email_address
    headers = factory_auth_header(jwt, claims)

    return headers, account_project


def create_contact_info_submission(item_id, auth_guid):
    """Create a contact information submission."""
    submitted_form = SubmittedForm(
        submission_json={
            'q_1': 'John Doe',  # Replace with actual JSON data
            'q_2': 'Fake',
        },  # Replace with actual JSON data
    )
    db.session.add(submitted_form)
    db.session.flush()

    submission = Submission(
        submitted_form_id=submitted_form.id,  # Replace with the appropriate submitted form ID or None
        item_id=item_id,  # Assuming package_id corresponds to the item_id
        type=SubmissionType.FORM,  # Replace with the appropriate SubmissionType
        submitted_document_id=None,  # Replace with the appropriate document ID or None
        created_by=auth_guid,  # Replace with the appropriate user ID
        major_version=1,
        minor_version=1,
        active=True,
        deleted=False,
        status=SubmissionStatus.SUBMITTED,  # Replace with the appropriate status
        root_submission_id=None,  # Replace with the root submission ID or None
    )
    db.session.add(submission)
    db.session.flush()
    db.session.commit()
    return submission


def factory_track_phase(
    session,
    *,
    work_type_id=None,
    ea_act_name='EA Act (2018)',
    work_type_name='Assessment',
    name=None,
    display_name=None,
    is_active=True,
    is_deleted=False,
):
    """Create and persist a TrackPhase for use in tests."""
    phase = TrackPhase(
        id=fake.random_int(min=10000, max=99999),
        name=name or fake.word().capitalize(),
        ea_act_name=ea_act_name,
        work_type_id=work_type_id or fake.random_int(min=1, max=100),
        work_type_name=work_type_name,
        display_name=display_name,
        is_active=is_active,
        is_deleted=is_deleted,
    )
    session.add(phase)
    session.flush()
    return phase


def factory_track_work(
    session,
    project_id,
    *,
    phase_id=None,
    work_state='IN_PROGRESS',
    title=None,
    is_active=True,
    is_deleted=False,
):
    """Create and persist a TrackWork for use in tests."""
    work = TrackWork(
        id=fake.random_int(min=10000, max=99999),
        project_id=project_id,
        current_phase_id=phase_id,
        work_state=work_state,
        title=title or fake.sentence(nb_words=4),
        is_active=is_active,
        is_deleted=is_deleted,
    )
    session.add(work)
    session.flush()
    return work
