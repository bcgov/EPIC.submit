"""Test Submission model ORM methods."""
from faker import Faker

from submit_api.models.submission import Submission
from tests.utilities.factory_utils import (
    create_contact_info_submission,
    factory_item_model,
    factory_package_model,
    factory_user_model,
)

fake = Faker()


def test_version_property():
    """Returns the version as a major.minor formatted string."""
    sub = Submission(major_version=2, minor_version=3)
    assert sub.version == '2.3'


def test_find_all_versions(session):
    """Returns a list of all non-pending submission versions for the given root id."""
    package = factory_package_model()
    item = factory_item_model(package)
    user = factory_user_model()
    sub = create_contact_info_submission(item.id, user.auth_guid)
    results = Submission.find_all_versions(sub.root_submission_id or sub.id)
    assert isinstance(results, list)
