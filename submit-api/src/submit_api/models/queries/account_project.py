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

from sqlalchemy import or_

from submit_api.enums.role import RoleEnum
from submit_api.models import AccountProject, Project, db, User
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.package import Package
from submit_api.models.user import UserType
from submit_api.utils.token_info import TokenInfo


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
    def get_account_project_by_id(cls, account_project_id: int):
        """Find account project by id."""
        query = db.session.query(AccountProject).filter(
            AccountProject.id == account_project_id
        )

        package_query = cls._filter_packages_by_user_access()
        if package_query:
            filtered_package_ids = package_query.with_entities(Package.id).subquery().select()
            query = query.join(Package).filter(
                Package.id.in_(filtered_package_ids)).options(
                db.contains_eager(AccountProject.packages))
        return query.first()

    @classmethod
    def get_filtered_account_projects_paginated(
            cls,
            account_id: int = None,
            search_options: AccountProjectSearchOptions = None,
            page: int = None,
            page_size: int = None
    ):
        """Find projects by account_id with optional search and pagination."""
        query = db.session.query(AccountProject)

        # Apply filters
        if account_id is not None:
            query = query.filter(AccountProject.account_id == account_id)

        if search_options and any(bool(search_option) for search_option in search_options.__dict__.values()):
            package_query = cls._filter_by_search_criteria(search_options)
            package_query = cls._filter_packages_by_user_access(package_query)
            if package_query:
                filtered_package_ids = package_query.with_entities(Package.id).subquery().select()
                query = (query.join(Package, Package.account_project_id == AccountProject.id)
                         .filter(Package.id.in_(filtered_package_ids)))

        # Apply pagination if page and page_size are provided
        if page and page_size:
            page = query.paginate(page=page, per_page=page_size)
            return page.items, page.total

        total = query.count()

        return query.all(), total

    @classmethod
    def _filter_by_search_criteria(cls, search_options: AccountProjectSearchOptions):
        """Apply various filters based on search options."""
        # Subquery to get packages based on search criteria
        query = db.session.query(Package)\
            .join(AccountProject)\
            .join(Project)\

        if search_options.search_text:
            query = cls._filter_by_search_text(query, search_options.search_text)
        if search_options.status:
            query = cls._filter_by_submission_status(query, search_options.status)
        if search_options.submitted_on_start or search_options.submitted_on_end:
            query = cls._filter_by_submission_dates(
                query, search_options.submitted_on_start, search_options.submitted_on_end
            )

        return query

    @classmethod
    def _filter_packages_by_user_access(cls, package_query=None):
        """Filter packages by user access."""
        auth_guid = TokenInfo.get_id()
        user = User.get_by_guid(auth_guid)

        if not user:
            raise ValueError("User not found.")

        if user.type == UserType.STAFF:
            return package_query

        if not user.account_user:
            raise ValueError("User account not found.")

        user_role = user.account_user.role
        role_name = user_role.role.role_name
        if role_name in [RoleEnum.SUBMISSION_ADMIN.value, RoleEnum.PROJECT_ADMIN.value]:
            return package_query

        if not package_query:
            package_query = db.session.query(Package)

        package_ids = user_role.package_ids
        if not package_ids:
            return package_query.filter(False)

        return package_query.filter(Package.id.in_(package_ids))

    @classmethod
    def _filter_by_search_text(cls, query, search_text):
        """Filter by search text across package name."""
        return query.filter(
            or_(
                Package.name.ilike(f"%{search_text}%"),
                Project.name.ilike(f"%{search_text}%"),
            )
        )

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
