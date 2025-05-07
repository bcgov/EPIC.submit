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
"""Model to handle all complex queries related to Account Project."""

from sqlalchemy import or_
from sqlalchemy.orm import joinedload, contains_eager
from submit_api.enums.role import RoleEnum
from submit_api.models.package import PackageStatus, NonCanonicalPackageStatus
from submit_api.models import AccountProject, Project, db, User
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.package import Package
from submit_api.models.user import UserType
from submit_api.schemas.project import AccountProjectSchema, StaffAccountProjectSchema
from submit_api.utils.token_info import TokenInfo
from submit_api.models.update_request import UpdateRequest, UpdateRequestType, UpdateRequestStatus


class ProjectQueries:
    """Query module for complex projects queries"""

    @classmethod
    def get_projects_by_proponent_id(cls, proponent_id: int):
        """Find projects by proponent_id"""
        return db.session.query(Project).filter(Project.proponent_id == proponent_id).all()

    @classmethod
    def get_account_project_by_id(cls, account_project_id: int):
        """Find account project by id."""
        query = db.session.query(AccountProject).filter(
            AccountProject.id == account_project_id)

        package_query = cls._filter_packages_by_user_access()
        if package_query:
            filtered_package_ids = [
                row[0] for row in package_query.with_entities(Package.id).all()]
            query = (query.join(Package).filter(Package.id.in_(filtered_package_ids))
                     .options(contains_eager(AccountProject.packages)))

        return query.first()

    @classmethod
    def get_filtered_package_ids(cls, search_options: AccountProjectSearchOptions) -> list:
        """Retrieve package IDs based on search filters."""
        package_query = cls._filter_by_search_criteria(search_options)
        package_query = cls._filter_packages_by_user_access(package_query)

        result = [row[0] for row in package_query.with_entities(
            Package.id).all()] if package_query else None
        return result

    @classmethod
    def get_paginated_account_project_ids(cls, account_id: int, filtered_package_ids: list,
                                          page: int, page_size: int) -> tuple:
        """Retrieve paginated AccountProject IDs based on filtering."""
        query = db.session.query(AccountProject)

        if account_id is not None:
            query = query.filter(AccountProject.account_id == account_id)

        # If no filtering applied, return all projects
        if filtered_package_ids is None:
            account_project_ids_query = query.distinct(AccountProject.id)
        else:
            account_project_ids_query = (query.join(Package).filter(Package.id.in_(filtered_package_ids))
                                         .distinct(AccountProject.id))

        # Apply pagination
        if page and page_size:
            paginated_result = (account_project_ids_query.with_entities(AccountProject.id)
                                .paginate(page=page, per_page=page_size))
            return [row[0] for row in paginated_result.items], paginated_result.total

        return ([row[0] for row in account_project_ids_query.with_entities(AccountProject.id).all()],
                account_project_ids_query.count())

    @classmethod
    def get_full_account_projects(cls, account_project_ids: list,
                                  is_proponent: bool, filtered_package_ids: list) -> list:
        """Retrieve full AccountProject objects, apply schema, and filter packages."""
        account_projects = (
            db.session.query(AccountProject)
            .filter(AccountProject.id.in_(account_project_ids))
            # Ensure packages are loaded
            .options(joinedload(AccountProject.packages))
        ).all()

        schema_class = AccountProjectSchema if is_proponent else StaffAccountProjectSchema
        account_projects_list = schema_class(many=True).dump(account_projects)

        # Filter packages only if filtering was applied
        if filtered_package_ids:
            for account_project in account_projects_list:
                account_project['packages'] = [package for package in account_project['packages']
                                               if package['id'] in filtered_package_ids]

        return account_projects_list

    @classmethod
    def get_filtered_account_projects_paginated(
            cls,
            account_id: int = None,
            search_options: AccountProjectSearchOptions = None,
            page: int = None,
            page_size: int = None,
            is_proponent: bool = True,
    ) -> tuple:
        """Main method to orchestrate filtered and paginated retrieval of AccountProjects."""
        filtered_package_ids = cls.get_filtered_package_ids(search_options)

        account_project_ids, total = cls.get_paginated_account_project_ids(account_id, filtered_package_ids,
                                                                           page, page_size)

        if not account_project_ids:
            return [], 0  # Return empty list if no matching projects

        account_projects_list = cls.get_full_account_projects(
            account_project_ids, is_proponent, filtered_package_ids)

        return account_projects_list, total

    @classmethod
    def _filter_by_search_criteria(cls, search_options: AccountProjectSearchOptions):
        """Apply various filters based on search options."""
        if not search_options or not any(bool(search_option) for search_option in search_options.__dict__.values()):
            return None

        query = db.session.query(Package).join(AccountProject).join(Project)

        if search_options.search_text:
            query = cls._filter_by_search_text(
                query, search_options.search_text)
        if search_options.status:
            query = cls._filter_by_submission_status(
                query, search_options.status)
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
        if not user_role:
            raise ValueError("User role not found.")

        if user_role.role.role_name in [RoleEnum.SUBMISSION_ADMIN.value, RoleEnum.PROJECT_ADMIN.value]:
            return package_query

        if user_role.package_ids:
            package_query = package_query.filter(Package.id.in_(user_role.package_ids)) if package_query\
                else db.session.query(Package).filter(Package.id.in_(user_role.package_ids))
        else:
            package_query = package_query.filter(False)

        return package_query

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
        """Filter by submission status, with special handling for revision required."""
        revision_required_value = PackageStatus.REVISION_REQUIRED.value
        update_requested_value = NonCanonicalPackageStatus.UPDATE_REQUESTED.value
        updated_value = NonCanonicalPackageStatus.UPDATED.value

        canonical_statuses = [
            status.value for status in statuses
            if isinstance(status, PackageStatus) and status.value != revision_required_value
        ]

        include_revision_required = any(
            status.value == revision_required_value for status in statuses)
        include_update_requested = any(status.value == update_requested_value for status in statuses)
        include_updated = any(status.value == updated_value for status in statuses)

        # Separate normal statuses and check if revision_required is included
        if canonical_statuses:
            query = query.filter(Package.status.op("@>")(canonical_statuses))

        if include_revision_required:
            query = cls._revision_required_filter(query)

        if include_update_requested:
            query = cls._update_requested_filter(query)

        if include_update_requested or include_updated:
            query = cls._update_status_filter(query, include_update_requested, include_updated)

        return query

    @classmethod
    def _revision_required_filter(cls, query):
        """Joins UpdateRequest and filters for packages requiring revision."""
        return query.join(UpdateRequest).filter(
            UpdateRequest.submission_package_id == Package.id,
            UpdateRequest.type == UpdateRequestType.REVIEW.value,
            UpdateRequest.active.is_(True),
            ~Package.status.op("@>")([
                PackageStatus.COMPLETED.value,
                PackageStatus.PARTIALLY_COMPLETED.value,
            ])
        )

    @classmethod
    def _update_status_filter(cls, query, include_update_requested, include_updated):
        """Join UpdateRequest once and apply appropriate update filters."""
        query = query.join(UpdateRequest, UpdateRequest.submission_package_id == Package.id)

        conditions = [UpdateRequest.type == UpdateRequestType.UPDATE.value,
                    UpdateRequest.active.is_(True)]

        if include_update_requested:
            conditions.append(UpdateRequest.status != UpdateRequestStatus.ACCEPTED.value)

        if include_updated:
            conditions.append(UpdateRequest.status == UpdateRequestStatus.PENDING_REVIEW.value)

        return query.filter(*conditions)

    @classmethod
    def _update_requested_filter(cls, query):
        """Joins UpdateRequest and filters for packages with active update requests."""
        return query.join(UpdateRequest).filter(
            UpdateRequest.submission_package_id == Package.id,
            UpdateRequest.type == UpdateRequestType.UPDATE.value,
            UpdateRequest.active.is_(True),
            UpdateRequest.status != UpdateRequestStatus.ACCEPTED.value
        )

    @classmethod
    def _updated_filter(cls, query):
        """Joins UpdateRequest and filters for packages with pending review updates."""
        return query.join(UpdateRequest).filter(
            UpdateRequest.submission_package_id == Package.id,
            UpdateRequest.type == UpdateRequestType.UPDATE.value,
            UpdateRequest.status == UpdateRequestStatus.PENDING_REVIEW.value,
            UpdateRequest.active.is_(True)
        )

    @classmethod
    def _filter_by_submission_dates(cls, query, submitted_on_start, submitted_on_end):
        """Filter by the submitted_on date range."""
        if submitted_on_start:
            query = query.filter(Package.submitted_on >= submitted_on_start)
        if submitted_on_end:
            query = query.filter(Package.submitted_on <= submitted_on_end)
        return query
