"""Unit tests for SubmissionService.get_all_versions with package_id filtering."""
from contextlib import contextmanager
from unittest.mock import Mock, patch

import pytest


SERVICE_MODULE = "submit_api.services.submission"


@contextmanager
def _noop_session_scope():
    """No-op context manager to replace session_scope in tests."""
    yield


@pytest.fixture()
def mock_submission():
    """Create a mock submission with root_submission_id."""
    submission = Mock()
    submission.id = 10
    submission.root_submission_id = 5
    return submission


@pytest.fixture()
def mock_versions():
    """Create a list of mock submission versions."""
    v1 = Mock()
    v1.id = 5
    v1.major_version = 1
    v1.minor_version = 1

    v2 = Mock()
    v2.id = 10
    v2.major_version = 1
    v2.minor_version = 2

    v3 = Mock()
    v3.id = 15
    v3.major_version = 2
    v3.minor_version = 1
    return [v3, v2, v1]


@pytest.fixture(autouse=True)
def mock_current_app():
    """Patch current_app to avoid application context errors."""
    with patch(f"{SERVICE_MODULE}.current_app", new=Mock()):
        yield


class TestGetAllVersions:
    """Tests for SubmissionService.get_all_versions with package_id."""

    @patch(f"{SERVICE_MODULE}.SubmissionModel.find_all_versions")
    @patch(f"{SERVICE_MODULE}.SubmissionModel.find_by_id")
    @patch(f"{SERVICE_MODULE}.session_scope", side_effect=_noop_session_scope)
    def test_returns_all_versions_without_package_id(
        self, mock_scope, mock_find_by_id, mock_find_all,
        mock_submission, mock_versions
    ):
        """Without package_id, returns all versions across packages."""
        from submit_api.services.submission import SubmissionService
        mock_find_by_id.return_value = mock_submission
        mock_find_all.return_value = mock_versions

        result = SubmissionService.get_all_versions(10)

        mock_find_all.assert_called_once_with(5, package_id=None)
        assert result == mock_versions

    @patch(f"{SERVICE_MODULE}.SubmissionModel.find_all_versions")
    @patch(f"{SERVICE_MODULE}.SubmissionModel.find_by_id")
    @patch(f"{SERVICE_MODULE}.session_scope", side_effect=_noop_session_scope)
    def test_returns_filtered_versions_with_package_id(
        self, mock_scope, mock_find_by_id, mock_find_all,
        mock_submission, mock_versions
    ):
        """With package_id, passes it to find_all_versions for filtering."""
        from submit_api.services.submission import SubmissionService
        mock_find_by_id.return_value = mock_submission
        mock_find_all.return_value = [mock_versions[1]]

        result = SubmissionService.get_all_versions(10, package_id=99)

        mock_find_all.assert_called_once_with(5, package_id=99)
        assert result == [mock_versions[1]]

    @patch(f"{SERVICE_MODULE}.SubmissionModel.find_by_id")
    @patch(f"{SERVICE_MODULE}.session_scope", side_effect=_noop_session_scope)
    def test_returns_none_when_submission_not_found(
        self, mock_scope, mock_find_by_id
    ):
        """Returns None when the submission ID does not exist."""
        from submit_api.services.submission import SubmissionService
        mock_find_by_id.return_value = None

        result = SubmissionService.get_all_versions(999)

        assert result is None

    @patch(f"{SERVICE_MODULE}.SubmissionModel.find_all_versions")
    @patch(f"{SERVICE_MODULE}.SubmissionModel.find_by_id")
    @patch(f"{SERVICE_MODULE}.session_scope", side_effect=_noop_session_scope)
    def test_uses_submission_id_as_root_when_no_root_submission_id(
        self, mock_scope, mock_find_by_id, mock_find_all,
        mock_versions
    ):
        """Uses the submission's own ID as root when root_submission_id is None."""
        from submit_api.services.submission import SubmissionService
        submission = Mock()
        submission.id = 7
        submission.root_submission_id = None
        mock_find_by_id.return_value = submission
        mock_find_all.return_value = mock_versions

        result = SubmissionService.get_all_versions(7, package_id=42)

        mock_find_all.assert_called_once_with(7, package_id=42)
        assert result == mock_versions
