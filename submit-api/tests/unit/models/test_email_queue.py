from submit_api.models.email_queue import EmailQueue, EmailStatus, EntityType


def test_find_pending(session):
    eq = EmailQueue(
        entity_id=1, entity_type=EntityType.PACKAGE.value,
        template_name='test_template', status=EmailStatus.PENDING.value
    )
    session.add(eq)
    session.flush()
    results = EmailQueue.find_pending()
    assert any(e.status == EmailStatus.PENDING.value for e in results)

def test_find_all(session):
    eq = EmailQueue(
        entity_id=2, entity_type=EntityType.PACKAGE.value,
        template_name='test_template2'
    )
    session.add(eq)
    session.flush()
    results = EmailQueue.find_all()
    assert len(results) >= 1