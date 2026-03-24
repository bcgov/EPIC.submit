from submit_api.models.account_project import AccountProject
from tests.utilities.factory_utils import (
    factory_account_model, factory_account_project_model, factory_package_model, factory_project_model)


def test_get_all_in_ids(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    result = AccountProject.get_all_in_ids([ap.id])
    assert any(r.id == ap.id for r in result)

def test_get_all_in_project_ids(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    result = AccountProject.get_all_in_project_ids([project.id])
    assert any(r.id == ap.id for r in result)

def test_get_all_in_account_ids(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    result = AccountProject.get_all_in_account_ids([account.id])
    assert any(r.id == ap.id for r in result)

def test_get_by_account_id(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    result = AccountProject.get_by_account_id(account.id)
    assert result.id == ap.id

def test_get_by_project_id(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    result = AccountProject.get_by_project_id(project.id)
    assert result.id == ap.id

def test_get_or_create_creates(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = AccountProject.get_or_create(account.id, project.id, session)
    assert ap.account_id == account.id
    assert ap.project_id == project.id

def test_get_or_create_returns_existing(session):
    account = factory_account_model()
    project = factory_project_model()
    ap1 = factory_account_project_model(account.id, project.id)
    ap2 = AccountProject.get_or_create(account.id, project.id, session)
    assert ap1.id == ap2.id

def test_get_project_ids_by_ids(session):
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    result = AccountProject.get_project_ids_by_ids([ap.id])
    assert project.id in result

def test_latest_packages_property(session):
    package = factory_package_model()
    ap = AccountProject.find_by_id(package.account_project_id)
    assert isinstance(ap.latest_packages, list)