"""Test Invitations model ORM methods."""
from datetime import datetime, timedelta, timezone

from submit_api.enums.invitation_status import InvitationStatus
from submit_api.models.invitations import Invitations
from tests.utilities.factory_utils import (
    factory_account_model,
    factory_invitation_model,
)


def test_find_by_token(session):
    """Returns the invitation matching the given token."""
    account = factory_account_model()
    inv = factory_invitation_model(account_id=account.id)
    result = Invitations.find_by_token(inv.token)
    assert result.id == inv.id


def test_find_by_token_not_found(session):
    """Returns None when no invitation matches the given token."""
    assert Invitations.find_by_token('nonexistent-token') is None


def test_find_pending_by_token(session):
    """Returns the invitation when it exists and has PENDING status."""
    account = factory_account_model()
    inv = factory_invitation_model(account_id=account.id)
    result = Invitations.find_pending_by_token(inv.token)
    assert result.id == inv.id


def test_find_pending_by_token_not_pending(session):
    """Returns None when the invitation exists but is not in PENDING status."""
    account = factory_account_model()
    inv = factory_invitation_model(
        account_id=account.id, status=InvitationStatus.USED.value
    )
    result = Invitations.find_pending_by_token(inv.token)
    assert result is None


def test_get_all_in_account_ids(session):
    """Returns pending and used invitations for the given account ids."""
    account = factory_account_model()
    factory_invitation_model(account_id=account.id)
    result = Invitations.get_all_in_account_ids([account.id])
    assert len(result) >= 1


def test_get_active_by_account_id(session):
    """Returns non-expired pending and revoked invitations for the given account."""
    account = factory_account_model()
    factory_invitation_model(account_id=account.id)
    result = Invitations.get_active_by_account_id(account.id)
    assert len(result) >= 1


def test_is_expired_false_for_future(session):
    """Returns False for is_expired when the expiry date is in the future."""
    account = factory_account_model()
    inv = factory_invitation_model(
        account_id=account.id,
        expiry_date=datetime.now(timezone.utc) + timedelta(days=7),
    )
    assert inv.is_expired is False


def test_is_expired_true_for_past(session):
    """Returns True for is_expired when the expiry date has passed."""
    account = factory_account_model()
    inv = factory_invitation_model(
        account_id=account.id,
        expiry_date=datetime.now(timezone.utc) - timedelta(days=1),
    )
    assert inv.is_expired is True


def test_generate_token():
    """Returns a non-empty string token."""
    token = Invitations.generate_token()
    assert isinstance(token, str)
    assert len(token) > 0


def test_to_dict(session):
    """Returns a dictionary with the expected invitation fields."""
    account = factory_account_model()
    inv = factory_invitation_model(account_id=account.id)
    d = inv.to_dict()
    assert d['account_id'] == account.id
    assert 'token' in d
    assert 'status' in d
