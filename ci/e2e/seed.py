"""Only prerequisites; onboarding, packages and reviews belong to the browser."""
from submit_api import create_app
from submit_api.models.db import db
from submit_api.models.proponent import Proponent
from submit_api.models.project import Project
from submit_api.enums.proponent_status import ProponentStatus

app = create_app()
with app.app_context():
    assert app.config['DB_HOST'] == 'db' and app.config['DB_NAME'] == 'submit_e2e'
    assert not Proponent.query.filter_by(id=9001).first(), 'Use a fresh database for each run'
    db.session.add(Proponent(id=9001, name='E2E Coastal Energy', status=ProponentStatus.ELIGIBLE))
    db.session.flush()
    db.session.add(Project(id=9001, name='E2E Coastal Project', proponent_id=9001,
                           ea_certificate='E2E-001', epic_guid='e2e-coastal-project',
                           has_approved_condition=True))
    db.session.commit()
