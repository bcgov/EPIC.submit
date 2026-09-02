"""Test AccountUser model ORM methods."""
from datetime import datetime, UTC

from faker import Faker

from submit_api.enums.role import RoleEnum
from submit_api.models.account_user import AccountUser
from submit_api.models.role import Role
from submit_api.models.user import UserType
from submit_api.models.user_role import UserRole
from tests.utilities.factory_utils import (
    create_proponent_with_role,
    factory_account_model,
    factory_account_project_model,
    factory_project_model,
    factory_user_model,
)

fake = Faker()


def test_get_by_guid(session):
    """Returns the account user associated with the given auth guid."""
    user = factory_user_model(user_type=UserType.PROPONENT)
    account = factory_account_model()
    au = AccountUser.create_account_user(
        {
            'account_id': account.id,
            'first_name': 'Jane',
            'last_name': 'Doe',
            'position': 'Dev',
            'work_email_address': fake.email(),
            'work_contact_number': '555-1234',
            'user_id': user.id,
        },
        session,
    )
    session.flush()
    result = AccountUser.get_by_guid(user.auth_guid)
    assert result.id == au.id


def test_get_users_by_account_id(session):
    """Returns all account users belonging to the given account."""
    user = factory_user_model(user_type=UserType.PROPONENT)
    account = factory_account_model()
    AccountUser.create_account_user(
        {
            'account_id': account.id,
            'first_name': 'Jane',
            'last_name': 'Doe',
            'position': 'Dev',
            'work_email_address': fake.email(),
            'work_contact_number': '555-1234',
            'user_id': user.id,
        },
        session,
    )
    session.flush()
    result = AccountUser.get_users_by_account_id(account.id)
    assert len(result) >= 1


def test_get_all_in_account_ids(session):
    """Returns all account users belonging to any of the given account ids."""
    user = factory_user_model(user_type=UserType.PROPONENT)
    account = factory_account_model()
    AccountUser.create_account_user(
        {
            'account_id': account.id,
            'first_name': 'Jane',
            'last_name': 'Doe',
            'position': 'Dev',
            'work_email_address': fake.email(),
            'work_contact_number': '555-1234',
            'user_id': user.id,
        },
        session,
    )
    session.flush()
    result = AccountUser.get_all_in_account_ids([account.id])
    assert len(result) >= 1


def test_has_agreed_to_terms_false_when_no_terms(session):
    """Returns False for has_agreed_to_terms when no terms version is set."""
    user = factory_user_model(user_type=UserType.PROPONENT)
    account = factory_account_model()
    au = AccountUser.create_account_user(
        {
            'account_id': account.id,
            'first_name': 'Jane',
            'last_name': 'Doe',
            'position': 'Dev',
            'work_email_address': fake.email(),
            'work_contact_number': '555-1234',
            'user_id': user.id,
        },
        session,
    )
    session.flush()
    assert au.has_agreed_to_terms is False


def test_to_dict(session):
    """Returns a dictionary with the expected account user fields."""
    user = factory_user_model(user_type=UserType.PROPONENT)
    account = factory_account_model()
    au = AccountUser.create_account_user(
        {
            'account_id': account.id,
            'first_name': 'Jane',
            'last_name': 'Doe',
            'position': 'Dev',
            'work_email_address': 'jane@test.com',
            'work_contact_number': '555-1234',
            'user_id': user.id,
        },
        session,
    )
    session.flush()
    d = au.to_dict()
    assert d['first_name'] == 'Jane'
    assert d['last_name'] == 'Doe'
    assert 'full_name' in d


def test_get_filtered_by_account_id_excludes_inactive_roles(session):
    """A user whose role on a project is revoked (inactive) is not returned for that project."""
    account = factory_account_model()
    project = factory_project_model()
    account_project = factory_account_project_model(account.id, project.id)
    session.flush()

    _, account_user, user_role = create_proponent_with_role(
        session,
        auth_guid=fake.uuid4(),
        account_id=account.id,
        account_project_id=account_project.id,
    )
    session.flush()

    # Active role => user is returned for the project scope.
    active_result = AccountUser.get_filtered_by_account_id(account.id, [account_project.id])
    assert account_user.id in [au.id for au in active_result]

    # Revoke (soft-delete) the role.
    user_role.active = False
    user_role.access_end = datetime.now(UTC)
    session.flush()

    # Inactive role => user is no longer returned for the project scope.
    revoked_result = AccountUser.get_filtered_by_account_id(account.id, [account_project.id])
    assert account_user.id not in [au.id for au in revoked_result]


def test_get_filtered_by_account_id_no_duplicates_for_multiple_active_roles(session):
    """A user with multiple active roles in scope is returned only once."""
    account = factory_account_model()
    project_a = factory_project_model(name="Project A")
    project_b = factory_project_model(name="Project B")
    account_project_a = factory_account_project_model(account.id, project_a.id)
    account_project_b = factory_account_project_model(account.id, project_b.id)
    session.flush()

    _, account_user, _ = create_proponent_with_role(
        session,
        auth_guid=fake.uuid4(),
        account_id=account.id,
        account_project_id=account_project_a.id,
    )
    # Second active role on another in-scope project for the same user.
    UserRole.create_user_role(
        {
            "account_user_id": account_user.id,
            "role_id": Role.get_by_name(RoleEnum.PROJECT_ADMIN.value).id,
            "package_ids": None,
            "account_project_id": account_project_b.id,
        },
        session=session,
    )
    session.flush()

    result = AccountUser.get_filtered_by_account_id(
        account.id, [account_project_a.id, account_project_b.id]
    )
    matching = [au.id for au in result if au.id == account_user.id]
    assert len(matching) == 1
