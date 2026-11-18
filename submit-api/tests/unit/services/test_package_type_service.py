"""Unit tests for PackageTypeService phase range resolution."""
from unittest.mock import patch

import pytest

from submit_api.services.package_type_service import PackageTypeService


DATA = {'ea_act_name': 'EA Act (2018)', 'work_type_name': 'Assessment', 'phase_name': 'Pre-EA'}


class TestResolvePhases:
    """Resolving start and end phases from the request payload."""

    def test_no_phase_fields_returns_none_pair(self):
        """A phase-less package type has neither a start nor an end phase."""
        assert PackageTypeService._resolve_phases({}) == (None, None)

    @patch('submit_api.services.package_type_service.TrackPhase')
    def test_end_defaults_to_start_phase(self, mock_track_phase):
        """Without end_phase_name the package type is a single-phase type."""
        start = mock_track_phase.find_by_identifiers.return_value

        result = PackageTypeService._resolve_phases(DATA)

        assert result == (start, start)
        mock_track_phase.find_by_identifiers.assert_called_once_with('EA Act (2018)', 'Assessment', 'Pre-EA')

    @patch('submit_api.services.package_type_service.TrackPhase')
    def test_end_phase_looked_up_with_same_act_and_work_type(self, mock_track_phase):
        """The end phase is resolved using the start phase's EA Act and work type."""
        start, end = object(), object()
        mock_track_phase.find_by_identifiers.side_effect = [start, end]

        result = PackageTypeService._resolve_phases({**DATA, 'end_phase_name': 'Early Engagement'})

        assert result == (start, end)
        mock_track_phase.find_by_identifiers.assert_called_with('EA Act (2018)', 'Assessment', 'Early Engagement')

    @patch('submit_api.services.package_type_service.TrackPhase')
    def test_unknown_end_phase_raises(self, mock_track_phase):
        """An end phase that cannot be found is reported as an error."""
        mock_track_phase.find_by_identifiers.side_effect = [object(), None]

        with pytest.raises(ValueError, match='Early Engagement'):
            PackageTypeService._resolve_phases({**DATA, 'end_phase_name': 'Early Engagement'})

    @patch('submit_api.services.package_type_service.TrackPhase')
    def test_unknown_start_phase_raises(self, mock_track_phase):
        """A start phase that cannot be found is reported as an error."""
        mock_track_phase.find_by_identifiers.return_value = None

        with pytest.raises(ValueError, match='Pre-EA'):
            PackageTypeService._resolve_phases(DATA)
