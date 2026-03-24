"""Test Account model ORM methods."""
from submit_api.models.account import Account
from tests.utilities.factory_utils import factory_account_model, factory_proponent_model


def test_get_by_proponent_id(session):
    """Returns the account matching the given proponent id."""
    account = factory_account_model()
    result = Account.get_by_proponent_id(account.proponent_id)
    assert result.id == account.id


def test_get_by_proponent_id_not_found(session):
    """Returns None when no account exists for the given proponent id."""
    assert Account.get_by_proponent_id(999999) is None


def test_get_ids_by_proponent_id(session):
    """Returns a list containing the account id for the given proponent."""
    account = factory_account_model()
    ids = Account.get_ids_by_proponent_id(account.proponent_id)
    assert account.id in ids


def test_get_ids_by_proponent_id_empty(session):
    """Returns an empty list when no accounts exist for the given proponent id."""
    assert Account.get_ids_by_proponent_id(999999) == []


def test_create_account(session):
    """Creates an account with the correct proponent id."""
    proponent = factory_proponent_model()
    account = Account.create_account({'proponent_id': proponent.id}, session)
    assert account.proponent_id == proponent.id
