"""Test TrackWork model ORM methods."""
from submit_api.models.track_work import TrackWork


def test_to_dict_includes_contact_email():
    """Returns contact_email in the dictionary when set."""
    work = TrackWork(
        id=1,
        project_id=10,
        current_phase_id=None,
        work_state="IN_PROGRESS",
        title="Test Work",
        contact_email="eao.test@gov.bc.ca",
    )
    result = work.to_dict()
    assert result["contact_email"] == "eao.test@gov.bc.ca"


def test_to_dict_contact_email_none():
    """Returns None for contact_email when not set."""
    work = TrackWork(
        id=2,
        project_id=10,
        current_phase_id=None,
        work_state="COMPLETED",
        title="Another Work",
    )
    result = work.to_dict()
    assert result["contact_email"] is None
