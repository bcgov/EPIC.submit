from submit_api.enums.role import RoleEnum
from submit_api.models.role import Role


def test_get_by_name(session):
    result = Role.get_by_name(RoleEnum.PROJECT_ADMIN.value)
    assert result is not None
    assert result.role_name == RoleEnum.PROJECT_ADMIN.value

def test_get_by_name_not_found(session):
    result = Role.get_by_name('NONEXISTENT_ROLE')
    assert result is None

def test_to_dict(session):
    role = Role.get_by_name(RoleEnum.PROJECT_ADMIN.value)
    d = role.to_dict()
    assert d['role_name'] == RoleEnum.PROJECT_ADMIN.value
    assert 'label' in d
    assert 'description' in d