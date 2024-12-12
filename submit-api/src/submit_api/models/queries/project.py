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
"""Model to handle all complex operations related to User."""

from submit_api.models import AccountProject, Project, db
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.package import Package


# pylint: disable=too-few-public-methods


class ProjectQueries:
    """Query module for complex projects queries"""

    @classmethod
    def get_projects_by_proponent_id(cls, proponent_id: int):
        """Find projects by proponent_id"""
        query = db.session.query(Project).filter(
            Project.proponent_id == proponent_id
        )
        return query.all()

    @classmethod
    def get_projects_by_account_id(cls, account_id: int, search_options: AccountProjectSearchOptions = None):
        """Find projects by account_id with optional search and pagination."""
        query = db.session.query(AccountProject).filter(
            AccountProject.account_id == account_id,
        ).join(AccountProject.project)

        # Apply search filters if provided
        if search_options and any(bool(search_option) for search_option in search_options.__dict__.values()):
            query = cls.filter_by_search_criteria(query, search_options)

        return query.all()

    @classmethod
    def filter_by_search_criteria(cls, project_query, search_options: AccountProjectSearchOptions):
        """Apply various filters based on search options."""
        # Subquery to get packages based on search criteria
        package_query = db.session.query(Package)

        if search_options.search_text:
            package_query = cls._filter_by_submission_name(package_query, search_options.search_text)
        if search_options.status:
            package_query = cls._filter_by_submission_status(package_query, search_options.status)
        if search_options.submitted_on_start or search_options.submitted_on_end:
            package_query = cls._filter_by_submission_dates(
                package_query, search_options.submitted_on_start, search_options.submitted_on_end
            )

        # Get the filtered packages
        filtered_package_ids = package_query.with_entities(Package.id).subquery().select()

        project_query = project_query.join(Package).filter(
            Package.id.in_(filtered_package_ids)).options(
            db.contains_eager(AccountProject.packages))

        return project_query

    @classmethod
    def _filter_by_submission_name(cls, query, search_text):
        """Filter by search text across package name."""
        return query.filter(Package.name.ilike(f"%{search_text}%"))

    @classmethod
    def _filter_by_submission_status(cls, query, statuses):
        """Filter by submission status using overlap."""
        status_values = [status.value for status in statuses]

        # check if Package.status has all the values in status_values
        return query.filter(Package.status.op("@>")(status_values))

    @classmethod
    def _filter_by_submission_dates(cls, query, submitted_on_start, submitted_on_end):
        """Filter by the submitted_on date range."""
        if submitted_on_start:
            query = query.filter(Package.submitted_on >= submitted_on_start)
        if submitted_on_end:
            query = query.filter(Package.submitted_on <= submitted_on_end)
        return query
