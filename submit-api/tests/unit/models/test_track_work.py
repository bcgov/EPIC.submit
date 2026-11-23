"""Test TrackWork model ORM methods."""
from unittest.mock import patch

from submit_api.models.package_type import PackageType
from submit_api.models.track_phase import TrackPhase
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


def _range_type(start_id, end_id, end_name="Early Engagement", end_display_name=None):
    """Build an in-memory package type with a start phase id and an end phase."""
    return PackageType(
        name="R", start_phase_id=start_id, end_phase_id=end_id,
        end_phase=TrackPhase(id=end_id, name=end_name, display_name=end_display_name))


def test_awaiting_phase_name_is_end_phase_when_work_is_only_in_start_phase():
    """In the start phase, the work is told it has not reached the end phase yet."""
    work = TrackWork(id=6, project_id=10, current_phase_id=5)

    with patch.object(PackageType, "find_by_phase_id", return_value=[_range_type(5, 6)]):
        assert work.awaiting_phase_name == "Early Engagement"
        assert work.to_dict()["awaiting_phase_name"] == "Early Engagement"


def test_awaiting_phase_name_prefers_the_display_name():
    """The end phase's display name overrides its name."""
    work = TrackWork(id=7, project_id=10, current_phase_id=5)

    with patch.object(PackageType, "find_by_phase_id", return_value=[_range_type(5, 6, end_display_name="EE")]):
        assert work.awaiting_phase_name == "EE"


def test_awaiting_phase_name_none_when_work_is_in_the_end_phase():
    """In the end phase there is nothing left to wait for."""
    work = TrackWork(id=8, project_id=10, current_phase_id=6)

    with patch.object(PackageType, "find_by_phase_id", return_value=[_range_type(5, 6)]):
        assert work.awaiting_phase_name is None


def test_awaiting_phase_name_none_for_single_phase_type_and_no_phase():
    """A type whose start and end phase are the same, or a work with no phase, has no awaiting phase."""
    single = _range_type(5, 5)
    with patch.object(PackageType, "find_by_phase_id", return_value=[single]):
        assert TrackWork(id=9, project_id=10, current_phase_id=5).awaiting_phase_name is None
    assert TrackWork(id=10, project_id=10, current_phase_id=None).awaiting_phase_name is None
