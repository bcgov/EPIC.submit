from faker import Faker

from submit_api.models.staff_user import StaffUser
from submit_api.models.user import UserType
from tests.utilities.factory_utils import factory_user_model


fake = Faker()

def test_get_by_guid(session):
    user = factory_user_model(user_type=UserType.STAFF)
    staff = StaffUser.create_staff_user({
        'first_name': 'John',
        'last_name': 'Smith',
        'work_email_address': fake.email(),
        'user_id': user.id
    }, session)
    session.flush()
    result = StaffUser.get_by_guid(user.auth_guid)
    assert result.id == staff.id

def test_create_staff_user(session):
    user = factory_user_model(user_type=UserType.STAFF)
    staff = StaffUser.create_staff_user({
        'first_name': 'Alice',
        'last_name': 'Wong',
        'work_email_address': 'alice@test.com',
        'user_id': user.id
    }, session)
    session.flush()
    assert staff.first_name == 'Alice'
    assert staff.full_name == 'Alice Wong'