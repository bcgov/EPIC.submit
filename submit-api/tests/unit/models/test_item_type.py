"""Test ItemType model ORM methods."""
from submit_api.models.item_type import ItemType


def test_find_by_name(session):
    """Returns the item type matching the given name."""
    result = ItemType.find_by_name('Submission Contact Information')
    assert result is not None


def test_find_by_name_not_found(session):
    """Returns None when no item type matches the given name."""
    result = ItemType.find_by_name('Nonexistent Item Type')
    assert result is None
