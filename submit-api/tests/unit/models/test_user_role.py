from faker import Faker

from submit_api.enums.role import ProponentPermissionsEnum, RoleEnum
from submit_api.models.user_role import UserRole
from tests.utilities.factory_utils import (
    create_proponent_with_role, factory_account_model, factory_account_project_model, factory_project_model)


fake = Faker()

def test_get_permissions_from_role_admin():
    perms = UserRole.get_permissions_from_role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)
    assert ProponentPermissionsEnum.CREATE_PACKAGE.value in perms
    assert ProponentPermissionsEnum.SUBMIT_PACKAGE.value in perms

def test_get_permissions_from_role_unknown():
    perms = UserRole.get_permissions_from_role('UNKNOWN_ROLE')
    assert perms == []

def test_get_all_in_user_ids(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    _, account_user, _ = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=account.id,
        account_project_id=ap.id
    )
    session.flush()
    results = UserRole.get_all_in_user_ids([account_user.id])
    assert len(results) >= 1

def test_get_role_by_account_user_id(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    _, account_user, _ = create_proponent_with_role(
        session, auth_guid=fake.uuid4(), account_id=account.id,
        account_project_id=ap.id
    )
    session.flush()
    result = UserRole.get_role_by_account_user_id(account_user.id)
    assert result is not None
    assert result.account_user_id == account_user.id