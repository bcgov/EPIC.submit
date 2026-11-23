"""Test AccountProjectWork model ORM methods."""

from submit_api.models.account_project_work import AccountProjectWork

from tests.utilities.factory_utils import (
    factory_account_model,
    factory_account_project_model,
    factory_project_model,
    factory_track_work,
)


def test_find_by_account_project_id(session):
    """Returns active associations for the given account project id."""
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw = AccountProjectWork.get_or_create(ap.id, work.id, session)
    session.flush()
    results = AccountProjectWork.find_by_account_project_id(ap.id)
    assert any(r.id == apw.id for r in results)


def test_find_by_account_project_id_excludes_inactive(session):
    """Excludes inactive associations when querying by account project id."""
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw = AccountProjectWork(account_project_id=ap.id, work_id=work.id, is_active=False)
    session.add(apw)
    session.flush()
    results = AccountProjectWork.find_by_account_project_id(ap.id)
    assert not any(r.id == apw.id for r in results)


def test_find_by_work_id(session):
    """Returns active associations for the given work id."""
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw = AccountProjectWork.get_or_create(ap.id, work.id, session)
    session.flush()
    results = AccountProjectWork.find_by_work_id(work.id)
    assert any(r.id == apw.id for r in results)


def test_find_by_work_id_excludes_inactive(session):
    """Excludes inactive associations when querying by work id."""
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw = AccountProjectWork(account_project_id=ap.id, work_id=work.id, is_active=False)
    session.add(apw)
    session.flush()
    results = AccountProjectWork.find_by_work_id(work.id)
    assert not any(r.id == apw.id for r in results)


def test_get_or_create_creates_new(session):
    """Creates a new association when none exists for the given account project and work."""
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw = AccountProjectWork.get_or_create(ap.id, work.id, session)
    assert apw.account_project_id == ap.id
    assert apw.work_id == work.id
    assert apw.is_active is True


def test_get_or_create_returns_existing(session):
    """Returns the existing association without creating a duplicate."""
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw1 = AccountProjectWork.get_or_create(ap.id, work.id, session)
    session.flush()
    apw2 = AccountProjectWork.get_or_create(ap.id, work.id, session)
    assert apw1.id == apw2.id


def test_get_or_create_reactivates_inactive(session):
    """Reactivates an existing inactive association instead of creating a new one."""
    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw = AccountProjectWork(account_project_id=ap.id, work_id=work.id, is_active=False)
    session.add(apw)
    session.flush()
    result = AccountProjectWork.get_or_create(ap.id, work.id, session)
    assert result.id == apw.id
    assert result.is_active is True


def test_has_archived_packages_follows_archived_packages_of_the_work(session):
    """The flag is false until a package linked to this account project work is archived."""
    from datetime import datetime, timezone

    from tests.utilities.factory_utils import factory_package_model

    account = factory_account_model()
    project = factory_project_model()
    ap = factory_account_project_model(account.id, project.id)
    work = factory_track_work(session, project_id=project.id)
    apw = AccountProjectWork.get_or_create(ap.id, work.id, session)
    package = factory_package_model(account_project=ap)
    package.account_project_work_id = apw.id
    session.add(package)
    session.commit()

    assert apw.has_archived_packages is False

    package.archived_on = datetime.now(timezone.utc)
    session.add(package)
    session.commit()

    assert apw.has_archived_packages is True
