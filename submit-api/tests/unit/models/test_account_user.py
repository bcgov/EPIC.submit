"""Test AccountUser model ORM methods."""
from faker import Faker

from submit_api.models.account_user import AccountUser
from submit_api.models.user import UserType
from tests.utilities.factory_utils import factory_account_model, factory_user_model

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
