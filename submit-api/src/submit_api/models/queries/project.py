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
from submit_api.models.package import Package, PackageStatus


# pylint: disable=too-few-public-methods


class ProjectQueries:
    """Query module for complex projects queries"""

    @classmethod
    def get_projects_by_account_id(
        cls, account_id: int, search_options=AccountProjectSearchOptions
    ):
        """Find projects by account_id with optional search and pagination."""
        # Disable autoflush for this query
        with db.session.no_autoflush:
            # Query projects by account ID
            query = (
                db.session.query(AccountProject)
                .filter(AccountProject.account_id == account_id)
                .join(Project)
            )

            # Retrieve projects and manually filter packages
            projects = query.all()

            for project in projects:
                project.packages = [
                    package
                    for package in project.packages
                    if cls._package_matches_criteria(package, search_options)
                ]

            # Return projects that have packages matching the criteria
            return [project for project in projects if project.packages]

    @classmethod
    def get_projects_by_proponent_id(cls, proponent_id: int):
        """Find projects by proponent_id"""
        query = db.session.query(Project).filter(Project.proponent_id == proponent_id)
        return query.all()

    @classmethod
    def _package_matches_criteria(cls, package, search_options):
        """Check if a package matches the search criteria."""
        # Text filtering
        if (
            search_options.search_text
            and search_options.search_text.lower() not in package.name.lower()
        ):
            return False

        # Status filtering - ensure that any of the statuses in search_options match package statuses
        if search_options.status:
            search_statuses = {
                status.value if isinstance(status, PackageStatus) else status
                for status in search_options.status
            }
            package_statuses = {status.value for status in package.status}
            if not search_statuses.intersection(package_statuses):
                return False

        # Submitted date range filtering
        if search_options.submitted_on_start:
            if (
                package.submitted_on is None
                or package.submitted_on < search_options.submitted_on_start
            ):
                return False
        if search_options.submitted_on_end:
            if (
                package.submitted_on is None
                or package.submitted_on > search_options.submitted_on_end
            ):
                return False

        return True

    @classmethod
    def filter_by_search_criteria(cls, query, search_options):
        """Apply various filters based on search options."""
        if not search_options:
            return query
        query = db.session.query(AccountProject).join(Package)
        query = cls._filter_by_submission_name(query, search_options.search_text)
        query = cls._filter_by_submission_status(query, search_options.status)
        query = cls._filter_by_submission_dates(
            query, search_options.submitted_on_start, search_options.submitted_on_end
        )
        return query

    @classmethod
    def _filter_by_submission_name(cls, query, search_text):
        """Filter by search text across package name."""
        if search_text:
            query = query.filter(Package.name.ilike(f"%{search_text}%"))
        return query

    @classmethod
    def _filter_by_submission_status(cls, query, statuses):
        """Filter by submission status using overlap."""
        if statuses:
            # Convert enum to string values
            status_values = [status.value for status in statuses]
            if status_values:
                query = query.filter(Package.status.op("&&")(status_values))
        return query

    @classmethod
    def _filter_by_submission_dates(cls, query, submitted_on_start, submitted_on_end):
        """Filter by the submitted_on date range."""
        if submitted_on_start:
            query = query.filter(Package.submitted_on >= submitted_on_start)
        if submitted_on_end:
            query = query.filter(Package.submitted_on <= submitted_on_end)
        return query
