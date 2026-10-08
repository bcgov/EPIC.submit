"""Unit tests for StaffUserWorkService de-provisioning by work_id + email."""
from unittest.mock import Mock, patch

import pytest

from submit_api.exceptions import ResourceNotFoundError
from submit_api.services.staff_user_work_service import StaffUserWorkService


MODULE_PATH = "submit_api.services.staff_user_work_service"


@pytest.fixture(autouse=True)
def _mock_current_app():
    """Provide a logger so the service can log without an app context."""
    with patch(f"{MODULE_PATH}.current_app", new=Mock()):
        yield


def _staff_user(auth_guid="guid-1", staff_user_id=1):
    """Build a stand-in StaffUser whose user carries the given auth_guid."""
    staff_user = Mock()
    staff_user.id = staff_user_id
    staff_user.user.auth_guid = auth_guid
    return staff_user


class TestRemoveStaffUserWork:
    """Tests for StaffUserWorkService.remove_staff_user_work."""

    @patch(f"{MODULE_PATH}.StaffUserWork")
    @patch(f"{MODULE_PATH}.StaffUser")
    def test_removes_single_assignment_and_strips_groups_when_last(
        self, mock_staff_user, mock_staff_user_work
    ):
        """Deactivates the matching assignment and removes OPS groups when no works remain."""
        staff_user = _staff_user(auth_guid="guid-1")
        mock_staff_user.get_by_email.return_value = staff_user

        assignment = Mock()
        assignment.is_active = True
        assignment.staff_user_id = 1
        mock_staff_user_work.find_by_staff_user_and_work.return_value = assignment
        mock_staff_user_work.find_by_staff_user_id.return_value = []

        with patch.object(StaffUserWorkService, "_remove_ops_groups") as mock_remove:
            StaffUserWorkService.remove_staff_user_work(
                work_id=10, email="a@b.ca"
            )

        assert assignment.is_active is False
        assignment.persist.assert_called_once()
        mock_remove.assert_called_once_with("guid-1")

    @patch(f"{MODULE_PATH}.StaffUserWork")
    @patch(f"{MODULE_PATH}.StaffUser")
    def test_keeps_groups_when_other_works_remain(
        self, mock_staff_user, mock_staff_user_work
    ):
        """Does not remove OPS groups when the user still has active works."""
        staff_user = _staff_user()
        mock_staff_user.get_by_email.return_value = staff_user

        assignment = Mock()
        assignment.is_active = True
        assignment.staff_user_id = 1
        mock_staff_user_work.find_by_staff_user_and_work.return_value = assignment
        mock_staff_user_work.find_by_staff_user_id.return_value = [Mock()]

        with patch.object(StaffUserWorkService, "_remove_ops_groups") as mock_remove:
            StaffUserWorkService.remove_staff_user_work(
                work_id=10, email="a@b.ca"
            )

        assert assignment.is_active is False
        mock_remove.assert_not_called()

    @patch(f"{MODULE_PATH}.StaffUser")
    def test_unknown_email_raises_not_found(self, mock_staff_user):
        """A missing staff user raises ResourceNotFoundError."""
        mock_staff_user.get_by_email.return_value = None

        with pytest.raises(ResourceNotFoundError):
            StaffUserWorkService.remove_staff_user_work(
                work_id=10, email="missing@b.ca"
            )

    @patch(f"{MODULE_PATH}.StaffUserWork")
    @patch(f"{MODULE_PATH}.StaffUser")
    def test_no_active_assignment_raises_not_found(
        self, mock_staff_user, mock_staff_user_work
    ):
        """A missing or inactive assignment raises ResourceNotFoundError."""
        mock_staff_user.get_by_email.return_value = _staff_user()
        mock_staff_user_work.find_by_staff_user_and_work.return_value = None

        with pytest.raises(ResourceNotFoundError):
            StaffUserWorkService.remove_staff_user_work(
                work_id=10, email="a@b.ca"
            )
