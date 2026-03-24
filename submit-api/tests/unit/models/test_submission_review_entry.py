"""Test SubmissionReview model ORM methods."""
from submit_api.models.submission_review import SubmissionReview
from submit_api.models.submission_review_entry import (
    SubmissionReviewEntry,
    SubmissionReviewEntryType,
)
from tests.utilities.factory_utils import (
    factory_item_model,
    factory_package_model,
    factory_user_model,
)


def test_get_review_entry_by_id_and_type(session):
    """Returns the review entry matching the given review id and entry type."""
    package = factory_package_model()
    item = factory_item_model(package)
    review = SubmissionReview(item_id=item.id, active=True)
    user = factory_user_model()
    session.add(review)
    session.flush()
    entry = SubmissionReviewEntry(
        review_id=review.id,
        type=SubmissionReviewEntryType.STAFF_RECOMMENDATION,
        entry={'note': 'test'},
        updated_by=user.auth_guid,
    )
    session.add(entry)
    session.flush()
    result = SubmissionReviewEntry.get_review_entry_by_id_and_type(
        review.id, SubmissionReviewEntryType.STAFF_RECOMMENDATION
    )
    assert result is not None
    assert result.review_id == review.id


def test_get_review_entry_not_found(session):
    """Returns None when no entry matches the given review id and type."""
    result = SubmissionReviewEntry.get_review_entry_by_id_and_type(
        999999, SubmissionReviewEntryType.STAFF_RECOMMENDATION
    )
    assert result is None
