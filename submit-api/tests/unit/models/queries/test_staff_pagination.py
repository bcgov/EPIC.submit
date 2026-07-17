# Copyright © 2024 Province of British Columbia
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
"""Unit tests for staff pagination logic in ProjectQueries.

Tests for _get_staff_visible_projects behavior (Task 5.1):
- Staff users only receive projects with visible packages
- Batch loop terminates after MAX_BATCHES iterations
- DB exhaustion mid-batch returns all visible projects found
- Proponent path is unaffected

Tests for page slicing, total, and cursor logic (Task 5.2):
- Full page returned when enough visible projects exist
- Last page partial results
- Total equals visible count (not raw DB count)
- FULL_ACCESS optimization path
- Zero visible projects
- Page beyond available data
"""
from unittest.mock import Mock, patch, MagicMock

from submit_api.models.queries.account_project import ProjectQueries, BATCH_SIZE, MAX_BATCHES

MODULE_PATH = "submit_api.models.queries.account_project"


def _make_project_dict(name, has_packages=True):
    """Create a mock project dict with or without packages."""
    packages = [{"id": abs(hash(name)) % 10000, "name": f"pkg-{name}"}] if has_packages else []
    return {"id": abs(hash(name)) % 10000, "name": name, "packages": packages}


def _make_batch_row(name):
    """Create a tuple simulating a query row (AccountProject, Project.name)."""
    mock_ap = Mock()
    mock_ap.name = name
    return (mock_ap, name)


def _make_mock_query(batch_results_sequence):
    """Create a mock query returning different batches on successive calls.

    Each element in batch_results_sequence is a list of tuples representing
    the results of offset().limit().all().
    """
    mock_query = MagicMock()
    chain = mock_query.add_columns.return_value.order_by.return_value.distinct.return_value
    chain.offset.return_value.limit.return_value.all.side_effect = batch_results_sequence
    return mock_query


# ---------------------------------------------------------------------------
# Task 5.1: Tests for _get_staff_visible_projects behavior
# ---------------------------------------------------------------------------


@patch(f"{MODULE_PATH}.ProjectQueries._filter_packages_by_user_access")
@patch(f"{MODULE_PATH}.ProjectQueries.get_full_account_projects")
@patch(f"{MODULE_PATH}.ProjectQueries._filter_by_search_criteria")
def test_excludes_projects_without_visible_packages(
    mock_filter_search, mock_get_full, mock_filter_packages
):
    """Staff users only receive projects with visible packages (empty excluded)."""
    batch_rows = [
        _make_batch_row("ProjectA"),
        _make_batch_row("ProjectB"),
        _make_batch_row("ProjectC"),
    ]
    mock_query = _make_mock_query([batch_rows])
    mock_filter_search.return_value = mock_query

    serialized = [
        _make_project_dict("ProjectA", has_packages=True),
        _make_project_dict("ProjectB", has_packages=False),
        _make_project_dict("ProjectC", has_packages=True),
    ]
    mock_get_full.return_value = serialized
    mock_filter_packages.return_value = serialized

    mock_user = Mock()
    search_options = Mock()

    result = ProjectQueries._get_staff_visible_projects(
        search_options, False, mock_user
    )

    assert len(result) == 2
    assert all(p.get("packages") for p in result)
    project_names = [p["name"] for p in result]
    assert "ProjectA" in project_names
    assert "ProjectC" in project_names
    assert "ProjectB" not in project_names


@patch(f"{MODULE_PATH}.ProjectQueries._filter_packages_by_user_access")
@patch(f"{MODULE_PATH}.ProjectQueries.get_full_account_projects")
@patch(f"{MODULE_PATH}.ProjectQueries._filter_by_search_criteria")
def test_batch_loop_terminates_at_max_batches(
    mock_filter_search, mock_get_full, mock_filter_packages
):
    """Batch loop terminates after MAX_BATCHES iterations and returns collected results."""
    full_batch = [_make_batch_row(f"Project{i}") for i in range(BATCH_SIZE)]
    batch_results_sequence = [full_batch] * (MAX_BATCHES + 5)
    mock_query = _make_mock_query(batch_results_sequence)
    mock_filter_search.return_value = mock_query

    call_count = [0]

    def get_full_side_effect(is_proponent, batch_projects):
        call_count[0] += 1
        return [_make_project_dict(f"Visible-{call_count[0]}", has_packages=True)]

    mock_get_full.side_effect = get_full_side_effect
    mock_filter_packages.side_effect = lambda projects, user: projects

    mock_user = Mock()
    search_options = Mock()

    result = ProjectQueries._get_staff_visible_projects(
        search_options, False, mock_user
    )

    assert mock_filter_search.call_count == MAX_BATCHES
    assert len(result) == MAX_BATCHES


@patch(f"{MODULE_PATH}.ProjectQueries._filter_packages_by_user_access")
@patch(f"{MODULE_PATH}.ProjectQueries.get_full_account_projects")
@patch(f"{MODULE_PATH}.ProjectQueries._filter_by_search_criteria")
def test_stops_when_db_exhausted_mid_batch(
    mock_filter_search, mock_get_full, mock_filter_packages
):
    """When a batch returns fewer than BATCH_SIZE, the loop stops and returns results."""
    full_batch = [_make_batch_row(f"Project{i}") for i in range(BATCH_SIZE)]
    partial_batch = [_make_batch_row(f"Partial{i}") for i in range(10)]
    mock_query = _make_mock_query([full_batch, partial_batch])
    mock_filter_search.return_value = mock_query

    call_count = [0]

    def get_full_side_effect(is_proponent, batch_projects):
        call_count[0] += 1
        return [
            _make_project_dict(f"V-b{call_count[0]}-{i}", has_packages=True)
            for i in range(len(batch_projects))
        ]

    mock_get_full.side_effect = get_full_side_effect
    mock_filter_packages.side_effect = lambda projects, user: projects

    mock_user = Mock()
    search_options = Mock()

    result = ProjectQueries._get_staff_visible_projects(
        search_options, False, mock_user
    )

    assert mock_filter_search.call_count == 2
    assert len(result) == BATCH_SIZE + 10


@patch(f"{MODULE_PATH}.ProjectQueries._filter_packages_by_user_access")
@patch(f"{MODULE_PATH}.ProjectQueries.get_full_account_projects")
@patch(f"{MODULE_PATH}.ProjectQueries._filter_by_search_criteria")
def test_stops_when_batch_returns_empty(
    mock_filter_search, mock_get_full, mock_filter_packages
):
    """When a batch returns no results, the loop stops immediately."""
    first_batch = [_make_batch_row(f"Project{i}") for i in range(5)]
    mock_query = _make_mock_query([first_batch, []])
    mock_filter_search.return_value = mock_query

    mock_get_full.return_value = [
        _make_project_dict(f"P{i}", has_packages=True) for i in range(5)
    ]
    mock_filter_packages.side_effect = lambda projects, user: projects

    mock_user = Mock()
    search_options = Mock()

    result = ProjectQueries._get_staff_visible_projects(
        search_options, False, mock_user
    )

    # First batch has 5 items (< BATCH_SIZE), so loop stops after first batch
    assert len(result) == 5


@patch(f"{MODULE_PATH}.ProjectQueries._filter_packages_by_user_access")
@patch(f"{MODULE_PATH}.ProjectQueries.get_full_account_projects")
@patch(f"{MODULE_PATH}.ProjectQueries._filter_by_search_criteria")
@patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="test-user")
@patch(f"{MODULE_PATH}.User.get_by_guid")
def test_proponent_path_does_not_use_staff_batch_loop(
    mock_get_by_guid, mock_get_username,
    mock_filter_search, mock_get_full, mock_filter_packages
):
    """Calling with is_proponent=True uses existing paginate path, not staff loop."""
    mock_user = Mock()
    mock_get_by_guid.return_value = mock_user

    mock_query = MagicMock()
    mock_filter_search.return_value = mock_query

    ordered = mock_query.add_columns.return_value.order_by.return_value.distinct.return_value
    mock_paginated = Mock()
    mock_paginated.items = [(_make_batch_row("ProponentProject")[0], "ProponentProject")]
    mock_paginated.total = 1
    ordered.paginate.return_value = mock_paginated

    mock_get_full.return_value = [_make_project_dict("ProponentProject", has_packages=True)]
    mock_filter_packages.return_value = [_make_project_dict("ProponentProject", has_packages=True)]

    result, total = ProjectQueries.get_filtered_account_projects_paginated(
        search_options=Mock(),
        page=1,
        page_size=10,
        is_proponent=True,
        user=mock_user
    )

    ordered.paginate.assert_called_once_with(page=1, per_page=10)
    assert total == 1
    assert len(result) == 1


# ---------------------------------------------------------------------------
# Task 5.2: Tests for page slicing, total, and cursor logic
# ---------------------------------------------------------------------------


@patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="test-user")
@patch(f"{MODULE_PATH}.User.get_by_guid")
@patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
@patch.object(ProjectQueries, "_get_staff_visible_projects")
def test_full_page_returned(mock_visible, mock_role, mock_get_user, mock_username):
    """Test that exactly page_size projects are returned when enough visible projects exist."""
    mock_user = Mock()
    mock_get_user.return_value = mock_user
    projects = [{"id": i, "name": f"Project {i}", "packages": [{"id": 1}]} for i in range(15)]
    mock_visible.return_value = projects

    result, total = ProjectQueries.get_filtered_account_projects_paginated(
        search_options=None, page=1, page_size=5, is_proponent=False, user=mock_user
    )

    assert len(result) == 5
    assert total == 15


@patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="test-user")
@patch(f"{MODULE_PATH}.User.get_by_guid")
@patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
@patch.object(ProjectQueries, "_get_staff_visible_projects")
def test_last_page_partial(mock_visible, mock_role, mock_get_user, mock_username):
    """Test that the last page returns fewer than page_size projects."""
    mock_user = Mock()
    mock_get_user.return_value = mock_user
    projects = [{"id": i, "name": f"Project {i}", "packages": [{"id": 1}]} for i in range(7)]
    mock_visible.return_value = projects

    result, total = ProjectQueries.get_filtered_account_projects_paginated(
        search_options=None, page=2, page_size=5, is_proponent=False, user=mock_user
    )

    assert len(result) == 2
    assert total == 7


@patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="test-user")
@patch(f"{MODULE_PATH}.User.get_by_guid")
@patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
@patch.object(ProjectQueries, "_get_staff_visible_projects")
def test_total_equals_visible_count(mock_visible, mock_role, mock_get_user, mock_username):
    """Test that total equals the number of visible projects, not raw DB count."""
    mock_user = Mock()
    mock_get_user.return_value = mock_user
    projects = [{"id": i, "name": f"Project {i}", "packages": [{"id": 1}]} for i in range(8)]
    mock_visible.return_value = projects

    result, total = ProjectQueries.get_filtered_account_projects_paginated(
        search_options=None, page=1, page_size=10, is_proponent=False, user=mock_user
    )

    assert total == 8
    assert len(result) == 8


@patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="test-user")
@patch(f"{MODULE_PATH}.User.get_by_guid")
@patch.object(ProjectQueries, "_get_full_access_paginated")
@patch(f"{MODULE_PATH}.jwt.contains_role", return_value=True)
def test_full_access_uses_optimized_path(mock_role, mock_paginated, mock_get_user, mock_username):
    """Test that FULL_ACCESS staff users use the optimized paginate path."""
    mock_user = Mock()
    mock_get_user.return_value = mock_user
    expected_projects = [{"id": 1, "name": "Project 1", "packages": [{"id": 1}]}]
    mock_paginated.return_value = (expected_projects, 1)

    result, total = ProjectQueries.get_filtered_account_projects_paginated(
        search_options=None, page=1, page_size=5, is_proponent=False, user=mock_user
    )

    mock_paginated.assert_called_once_with(None, 1, 5, mock_user)
    assert result == expected_projects
    assert total == 1


@patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="test-user")
@patch(f"{MODULE_PATH}.User.get_by_guid")
@patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
@patch.object(ProjectQueries, "_get_staff_visible_projects")
def test_zero_visible_projects(mock_visible, mock_role, mock_get_user, mock_username):
    """Test that zero visible projects returns ([], 0)."""
    mock_user = Mock()
    mock_get_user.return_value = mock_user
    mock_visible.return_value = []

    result, total = ProjectQueries.get_filtered_account_projects_paginated(
        search_options=None, page=1, page_size=5, is_proponent=False, user=mock_user
    )

    assert result == []
    assert total == 0


@patch(f"{MODULE_PATH}.TokenInfo.get_username", return_value="test-user")
@patch(f"{MODULE_PATH}.User.get_by_guid")
@patch(f"{MODULE_PATH}.jwt.contains_role", return_value=False)
@patch.object(ProjectQueries, "_get_staff_visible_projects")
def test_page_beyond_data(mock_visible, mock_role, mock_get_user, mock_username):
    """Test that requesting a page beyond available data returns empty with correct total."""
    mock_user = Mock()
    mock_get_user.return_value = mock_user
    projects = [{"id": i, "name": f"Project {i}", "packages": [{"id": 1}]} for i in range(3)]
    mock_visible.return_value = projects

    result, total = ProjectQueries.get_filtered_account_projects_paginated(
        search_options=None, page=2, page_size=5, is_proponent=False, user=mock_user
    )

    assert result == []
    assert total == 3
