"""Regression coverage for document roles when reorganizing submissions."""
from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from submit_api.exceptions import BadRequestError
from submit_api.models.submission import SubmissionStatus
from submit_api.services.submission import submission_creator_factory as factory
from submit_api.utils.submission_validation import missing_main_document_message


@pytest.fixture
def creator(monkeypatch):
    """Keep persistence outside these move-decision tests."""
    monkeypatch.setattr(factory, 'current_app', Mock())
    document = SimpleNamespace(id=2, url='old.pdf', name='plan.pdf', folder='main')
    monkeypatch.setattr(factory.SubmittedDocumentModel, 'find_by_id', Mock(return_value=document))
    result = factory.DocumentSubmissionCreator()
    monkeypatch.setattr(result, '_create_submitted_document', Mock(return_value=SimpleNamespace(id=3)))
    monkeypatch.setattr(
        result, '_create_submission',
        Mock(side_effect=lambda session, data: SimpleNamespace(id=4, **data)),
    )
    return result


def source_document(priority):
    """Build an active submitted document eligible for a staff move."""
    return SimpleNamespace(
        id=1, item_id=10, submitted_document_id=2, sort_order=priority,
        minor_version=1, active=True, deleted=False,
        status=SubmissionStatus.SUBMITTED, created_by='staff',
    )


@pytest.mark.parametrize('source_priority,destination_priority', [(0, 1), (1, 0), (0, 2)])
def test_folder_move_uses_destination_priority(creator, source_priority, destination_priority):
    """Moving changes the document role, including future priority groups."""
    source = source_document(source_priority)
    result = creator._move_to_folder(Mock(), source, {
        'destination_item_id': 20,
        'destination_folder': 'destination',
        'destination_url': 'new.pdf',
        'destination_sort_order': destination_priority,
    })
    assert result.sort_order == destination_priority
    assert result.item_id == 20
    assert source.deleted and not source.active


@pytest.mark.parametrize('priority', [None, -1, True, '0', 0.5])
def test_folder_move_rejects_missing_or_invalid_priority(creator, priority):
    """An incomplete move must not silently preserve the source's role."""
    source = source_document(0)
    with pytest.raises(BadRequestError, match='destination_sort_order'):
        creator._move_to_folder(Mock(), source, {'destination_sort_order': priority})
    creator._create_submission.assert_not_called()
    assert source.active and not source.deleted


@pytest.mark.parametrize('source_priority,target_priority', [(0, 1), (1, 0)])
def test_move_onto_existing_document_keeps_target_priority(creator, monkeypatch, source_priority, target_priority):
    """Replacing a document inherits its existing role, not the submitted move priority."""
    source = source_document(source_priority)
    target = source_document(target_priority)
    target.id = 2
    target.root_submission_id = 2
    target.submitted_document = SimpleNamespace(folder='target')
    monkeypatch.setattr(factory.SubmissionModel, 'find_by_id', Mock(return_value=target))
    monkeypatch.setattr(factory.ItemModel, 'find_by_id', Mock(return_value=SimpleNamespace(package_id=1)))
    result = creator._create_next_version_of_target(Mock(), source, {
        'target_submission_id': 2, 'destination_sort_order': source_priority,
    })
    assert result.sort_order == target_priority
    assert not target.active
    assert source.deleted


@pytest.mark.parametrize('name,label', [
    ('Initial Project Description', 'IPD'),
    ('Geospatial Information', 'GIS'),
    ('Engagement Plan', 'Engagement Plan'),
    ('Management Plan', 'Management Plan'),
])
def test_shared_validation_message(name, label):
    """Package and item validation retain the requested section wording."""
    assert missing_main_document_message(name) == (
        'You must have at least one file uploaded in this section '
        f'(section/document name:  {label}) to be able to submit your package'
    )


@pytest.mark.parametrize('priority', [0, 1, 2])
def test_replacing_document_preserves_existing_priority(creator, monkeypatch, priority):
    """A new version retains its role regardless of upload metadata."""
    source = source_document(priority)
    source.root_submission_id = source.id
    source.submitted_document = SimpleNamespace(folder='existing')
    monkeypatch.setattr(factory.SubmissionModel, 'find_by_id', Mock(return_value=source))
    monkeypatch.setattr(factory, 'session_scope', lambda: nullcontext(Mock()))
    monkeypatch.setattr(factory.TokenInfo, 'get_username', lambda: 'staff')
    result = creator.replace(source.id, {'sort_order': 99})
    assert result.sort_order == priority


def test_same_url_does_not_skip_a_priority_change(creator):
    """Existing storage location does not override an explicitly changed role."""
    source = source_document(1)
    result = creator._move_to_folder(Mock(), source, {
        'destination_item_id': source.item_id,
        'destination_url': 'old.pdf',
        'destination_folder': 'main',
        'destination_sort_order': 0,
    })
    assert result.sort_order == 0
    assert source.deleted
