#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Unit tests for report-package visibility in the staff access filter.

The "Reports & Recurring Submissions" section is gated the same way as the
Management Plans section: a staff user with the ``mp_view`` role sees report
obligations in the project listing. These tests exercise the real
``_filter_packages_by_user_access`` to prove REPORT packages survive for
``mp_view`` staff, are dropped without it, and are always returned for
``full_access`` staff.
"""
from unittest.mock import Mock, patch

from submit_api.models.queries.account_project import ProjectQueries
from submit_api.models.user import UserType
from submit_api.utils.roles import EpicSubmitRole

MODULE_PATH = "submit_api.models.queries.account_project"


def _mp_package(package_id=1):
    """A Management Plan package dict as serialized into the listing."""
    return {
        "id": package_id,
        "account_project_work_id": None,
        "account_project_work": None,
        "type": {"name": "Management Plan"},
    }


def _report_package(package_id=2):
    """A Report obligation package dict as serialized into the listing."""
    return {
        "id": package_id,
        "account_project_work_id": None,
        "account_project_work": None,
        "type": {"name": "Report"},
    }


def _account_project(packages):
    """Wrap packages in a minimal account_project listing dict."""
    return [{"id": 1, "name": "Cariboo Gold", "packages": list(packages)}]


def _staff_user():
    """A staff user mock with a staff_user profile attached."""
    user = Mock()
    user.type = UserType.STAFF
    user.staff_user = Mock(id=99)
    return user


def _role_checker(*granted):
    """Return a jwt.contains_role side effect granting only the given roles."""
    granted_set = set(granted)

    def _contains(roles):
        return any(role in granted_set for role in roles)

    return _contains


@patch(f"{MODULE_PATH}.ProjectQueries._get_accessible_work_ids_for_staff_user", return_value=[])
@patch(f"{MODULE_PATH}.jwt.contains_role")
def test_mp_view_staff_sees_report_packages(mock_contains_role, _mock_work_ids):
    """A staff user with mp_view retains Report packages in the listing."""
    mock_contains_role.side_effect = _role_checker(EpicSubmitRole.MP_VIEW.value)

    projects = _account_project([_mp_package(1), _report_package(2)])
    result = ProjectQueries._filter_packages_by_user_access(projects, _staff_user())

    package_ids = {pkg["id"] for pkg in result[0]["packages"]}
    assert package_ids == {1, 2}


@patch(f"{MODULE_PATH}.ProjectQueries._get_accessible_work_ids_for_staff_user", return_value=[])
@patch(f"{MODULE_PATH}.jwt.contains_role")
def test_staff_without_mp_view_does_not_see_report_packages(mock_contains_role, _mock_work_ids):
    """A staff user lacking mp_view gets no Report (or MP) packages."""
    mock_contains_role.side_effect = _role_checker()  # no roles granted

    projects = _account_project([_mp_package(1), _report_package(2)])
    result = ProjectQueries._filter_packages_by_user_access(projects, _staff_user())

    assert result[0]["packages"] == []


@patch(f"{MODULE_PATH}.ProjectQueries._get_accessible_work_ids_for_staff_user", return_value=[])
@patch(f"{MODULE_PATH}.jwt.contains_role")
def test_full_access_staff_sees_all_packages_including_reports(mock_contains_role, _mock_work_ids):
    """A full_access staff user bypasses the filter and keeps every package."""
    mock_contains_role.side_effect = _role_checker(EpicSubmitRole.FULL_ACCESS.value)

    projects = _account_project([_mp_package(1), _report_package(2)])
    result = ProjectQueries._filter_packages_by_user_access(projects, _staff_user())

    package_ids = {pkg["id"] for pkg in result[0]["packages"]}
    assert package_ids == {1, 2}


@patch(f"{MODULE_PATH}.ProjectQueries._get_accessible_work_ids_for_staff_user", return_value=[])
@patch(f"{MODULE_PATH}.jwt.contains_role")
def test_mp_view_staff_still_sees_management_plan_packages(mock_contains_role, _mock_work_ids):
    """mp_view visibility of Management Plan packages is unchanged."""
    mock_contains_role.side_effect = _role_checker(EpicSubmitRole.MP_VIEW.value)

    projects = _account_project([_mp_package(1)])
    result = ProjectQueries._filter_packages_by_user_access(projects, _staff_user())

    package_ids = {pkg["id"] for pkg in result[0]["packages"]}
    assert package_ids == {1}
