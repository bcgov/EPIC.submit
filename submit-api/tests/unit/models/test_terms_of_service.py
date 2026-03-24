from faker import Faker

from submit_api.models.account_terms_of_service import TermsOfService


fake = Faker()


def test_get_active_terms_of_service(session):
    data = {'version': fake.random_int(100, 999), 'content': 'Terms content', 'active': True}
    TermsOfService.create_terms_of_service(data, session)
    result = TermsOfService.get_active_terms_of_service()
    assert result is not None
    assert result.active is True

def test_get_active_terms_of_service_by_version(session):
    version = fake.random_int(1000, 9999)
    data = {'version': version, 'content': 'Terms content', 'active': True}
    TermsOfService.create_terms_of_service(data, session)
    result = TermsOfService.get_active_terms_of_service_by_version(version)
    assert result is not None
    assert result.version == version

def test_create_deactivates_existing(session):
    v1 = fake.random_int(10000, 19999)
    v2 = fake.random_int(20000, 29999)
    TermsOfService.create_terms_of_service({'version': v1, 'content': 'v1'}, session)
    TermsOfService.create_terms_of_service({'version': v2, 'content': 'v2'}, session)
    old = TermsOfService.get_active_terms_of_service_by_version(v1)
    assert old is None or old.active is False