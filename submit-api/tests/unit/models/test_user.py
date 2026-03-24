from faker import Faker

from submit_api.models.user import User, UserType
from tests.utilities.factory_utils import factory_user_model


fake = Faker()
 
def test_get_by_guid(session):
    user = factory_user_model()
    result = User.get_by_guid(user.auth_guid)
    assert result.id == user.id

def test_get_by_guid_not_found(session):
    result = User.get_by_guid('nonexistent-guid')
    assert result is None

def test_get_status_name_by_id(session):
    user = factory_user_model()
    result = User.get_status_name_by_id(user.id)
    assert result is not None

def test_get_status_name_by_id_not_found(session):
    result = User.get_status_name_by_id(999999)
    assert result is None

def test_create_user(session):
    guid = fake.uuid4()
    user = User.create_user({'auth_guid': guid, 'type': UserType.STAFF}, session)
    assert user.auth_guid == guid
    assert user.type == UserType.STAFF