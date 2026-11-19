"""Project and document searches use the inclusive BC dates selected by the user."""
from datetime import datetime

import pytest

from submit_api.models.account_project_search_options import AccountProjectSearchOptions, ProjectDocumentSearchOptions
from submit_api.models.queries.account_project import ProjectQueries
from submit_api.models.queries.submitted_document import DocumentQueries
from submit_api.models.submission import SubmissionStatus
from tests.utilities.factory_utils import (
    factory_account_model, factory_account_project_model, factory_document_submission_model, factory_item_model,
    factory_package_model, factory_project_model)


@pytest.fixture
def submissions(session, creator):
    """Create one project and document for each UTC instant around the BC day."""
    account = factory_account_model()
    rows = []
    for instant in ('2026-11-19T06:59:59.999999', '2026-11-19T07:00', '2026-11-19T21:00',
                    '2026-11-20T06:59:59.999999', '2026-11-20T07:00'):
        project = factory_project_model(name=f"Boundary {instant}")
        package = factory_package_model(account_project=factory_account_project_model(account.id, project.id))
        package.submitted_on = datetime.fromisoformat(instant)
        submission = factory_document_submission_model(
            factory_item_model(package=package), created_by=creator, status=SubmissionStatus.SUBMITTED)
        submission.root_submission_id = submission.id
        rows.append((package.account_project_id, submission.submitted_document_id))
    session.flush()
    return rows


@pytest.mark.parametrize(('start', 'end', 'expected'), [
    ('2026-11-19', '2026-11-19', [1, 2, 3]),
    ('2026-11-19', None, [1, 2, 3, 4]),
    (None, '2026-11-19', [0, 1, 2, 3]),
    ('2026-11-19T07:00:00', '2026-11-19T21:00:00', [1, 2]),
])
@pytest.mark.parametrize('listing', ['projects', 'documents'])
def test_submitted_date_bounds(submissions, listing, start, end, expected):
    """Check returned IDs for a single BC day and for each open-ended range."""
    if listing == 'projects':
        options = AccountProjectSearchOptions(None, None, start, end)
        results = ProjectQueries._filter_by_search_criteria(options).all()
        ids = [project_id for project_id, _ in submissions]
    else:
        options = ProjectDocumentSearchOptions(page=1, size=100, submitted_on_start=start, submitted_on_end=end)
        results = DocumentQueries.get_documents_paginated(options).items
        ids = [document_id for _, document_id in submissions]
    assert {row.id for row in results} == {ids[index] for index in expected}
