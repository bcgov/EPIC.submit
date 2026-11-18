"""Test TrackWork model ORM methods."""
from unittest.mock import patch

from submit_api.models.package_type import PackageType
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


def test_phase_label_none_without_current_phase():
    """No label is returned (and no query is made) when the work has no current phase."""
    work = TrackWork(id=3, project_id=10, current_phase_id=None)
    assert work.phase_label is None


def test_phase_label_uses_first_labelled_package_type():
    """The label comes from the first package type matching the current phase that has a label."""
    work = TrackWork(id=4, project_id=10, current_phase_id=5)
    unlabelled = PackageType(name="A")
    labelled = PackageType(name="B", phase_label="Pre-EA/Early Engagement")

    with patch.object(PackageType, "find_by_phase_id", return_value=[unlabelled, labelled]) as finder:
        assert work.phase_label == "Pre-EA/Early Engagement"
        assert work.to_dict()["phase_label"] == "Pre-EA/Early Engagement"
    finder.assert_called_with(5)


def test_phase_label_none_when_no_package_type_has_label():
    """No label is returned when no matching package type has one."""
    work = TrackWork(id=5, project_id=10, current_phase_id=5)

    with patch.object(PackageType, "find_by_phase_id", return_value=[PackageType(name="A")]):
        assert work.phase_label is None
