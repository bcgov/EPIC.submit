"""Test Utils.

Test Utility for creating factory.
"""

from submit_api.models import db
from submit_api.models.account import Account
from submit_api.models.account_project import AccountProject
from submit_api.models.project import Project


def factory_project_model(name="Test Project", proponent_id=1234):
    """Create a project model."""
    from submit_api.models.proponent import Proponent
    existing_proponent = Proponent.query.filter_by(id=proponent_id).first()
    if not existing_proponent:
        proponent = Proponent(
            id=proponent_id,
            name=f"Test Proponent {proponent_id}",
            is_deleted=False
        )
        db.session.add(proponent)
        db.session.flush()
    
    project = Project(
        name=name,
        proponent_id=proponent_id,
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
