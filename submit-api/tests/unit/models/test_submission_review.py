from submit_api.models.submission_review import SubmissionReview
from tests.utilities.factory_utils import factory_item_model, factory_package_model


def test_get_active_review_by_item_id(session):
    package = factory_package_model()
    item = factory_item_model(package)
    review = SubmissionReview(item_id=item.id, active=True)
    session.add(review)
    session.flush()
    result = SubmissionReview.get_active_review_by_item_id(item.id)
    assert result is not None
    assert result.item_id == item.id

def test_get_active_review_by_item_id_not_found(session):
    result = SubmissionReview.get_active_review_by_item_id(999999)
    assert result is None