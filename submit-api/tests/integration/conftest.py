"""Shared fixtures for the integration test suite."""
import copy

import pytest

from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import factory_auth_header, factory_user_model


@pytest.fixture()
def staff_claims():
    """Return a copy of the staff admin JWT claims."""
    return copy.deepcopy(dict(TestJwtClaims.staff_admin_role))


@pytest.fixture(scope="function")
def session(app, db):  # pylint: disable=redefined-outer-name
    """Transaction-bound session whose queries support Flask-SQLAlchemy's ``paginate``.

    Overrides the root ``session`` fixture for integration tests and restores
    ``db.session`` on teardown so later tests never see a stale scoped session.
    """
    from flask_sqlalchemy.query import Query
    from sqlalchemy import event
    from sqlalchemy.orm import scoped_session, sessionmaker

    original_session = db.session
    connection = db.engine.connect()
    transaction = connection.begin()
    scoped_sess = scoped_session(sessionmaker(bind=connection, query_cls=Query))
    scoped_sess.begin_nested()

    @event.listens_for(scoped_sess(), "after_transaction_end")
    def restart_savepoint(sess, trans):  # pylint: disable=unused-argument
        if trans.nested and not trans._parent.nested:  # pylint: disable=protected-access
            sess.begin_nested()

    db.session = scoped_sess
    yield scoped_sess

    scoped_sess.remove()
    transaction.rollback()
    connection.close()
    db.session = original_session


@pytest.fixture()
def creator(session):
    """Return the auth_guid of a persisted user, usable as created_by."""
    return factory_user_model(session=session).auth_guid


@pytest.fixture()
def worker_app(app):
    """Return an app stand-in whose app_context re-uses the current (test) context.

    Background workers push their own app context; on exit Flask-SQLAlchemy would
    remove the transaction-bound test session. A null context avoids that.
    """
    from contextlib import nullcontext
    from types import SimpleNamespace

    return SimpleNamespace(app_context=nullcontext)


@pytest.fixture()
def auth_header(session, jwt, staff_claims):
    """Return Authorization headers for a persisted staff admin user."""
    from submit_api.models import User

    if not User.query.filter_by(auth_guid=staff_claims['preferred_username']).first():
        factory_user_model(auth_guid=staff_claims['preferred_username'], session=session)
    return factory_auth_header(jwt=jwt, claims=staff_claims)
