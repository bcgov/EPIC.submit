"""Test User model ORM methods."""
from faker import Faker

from submit_api.models.user import User, UserType
from tests.utilities.factory_utils import factory_user_model

fake = Faker()


def test_get_by_guid(session):
    """Returns the user matching the given auth guid."""
    user = factory_user_model()
    result = User.get_by_guid(user.auth_guid)
    assert result.id == user.id


def test_get_by_guid_not_found(session):
    """Returns None when no user matches the given auth guid."""
    result = User.get_by_guid('nonexistent-guid')
    assert result is None


def test_get_status_name_by_id(session):
    """Returns the status name string for the given user id."""
    user = factory_user_model()
    result = User.get_status_name_by_id(user.id)
    assert result is not None


def test_get_status_name_by_id_not_found(session):
    """Returns None when no user exists for the given id."""
    result = User.get_status_name_by_id(999999)
    assert result is None


def test_create_user(session):
    """Creates a user with the correct auth guid and type."""
    guid = fake.uuid4()
    user = User.create_user({'auth_guid': guid, 'type': UserType.STAFF}, session)
    assert user.auth_guid == guid
    assert user.type == UserType.STAFF
