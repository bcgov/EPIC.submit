"""Test Utils.

Test Utility for creating factory.
"""

from submit_api.models import db
from submit_api.models.account import Account
from submit_api.models.account_project import AccountProject
from submit_api.models.project import Project


def factory_project_model(name="Test Project", proponent_id=1234, proponent_name="Test Proponent"):
    """Create a project model."""
    project = Project(
        name=name,
        proponent_id=proponent_id,
        proponent_name=proponent_name,
        ea_certificate=None,
        epic_guid=None
    )
    db.session.add(project)
    db.session.commit()
    return project


def factory_account_model(proponent_id=1234):
    """Create an account model."""
    account = Account(proponent_id=proponent_id)
    db.session.add(account)
    db.session.commit()
    return account


def factory_account_project_model(account_id, project_id):
    """Create an account project model."""
    account_project = AccountProject(account_id=account_id, project_id=project_id)
    db.session.add(account_project)
    db.session.commit()
    return account_project
