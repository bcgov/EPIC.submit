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
from sqlalchemy.orm import joinedload, aliased
from submit_api.enums.role import RoleEnum
from submit_api.models.package import PackageStatus, NonCanonicalPackageStatus
from submit_api.models import AccountProject, Project, db, User, PackageVersion
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.package import Package
from submit_api.models.item import Item
from submit_api.models.user import UserType
from submit_api.schemas.project import AccountProjectSchema, StaffAccountProjectSchema
from submit_api.utils.token_info import TokenInfo
from submit_api.models.update_request import UpdateRequest, UpdateRequestType, UpdateRequestStatus
from submit_api.services.package_service import PackageService


class ProjectQueries:
    """Query module for complex projects queries"""

    @classmethod
    def get_accessible_account_project_ids_for_user(cls, user):
        """Return all account_project_ids accessible by the user based on their roles."""
        if user.type == UserType.STAFF:
            # Staff can access all projects
            account_project_ids = db.session.query(AccountProject.id).all()
            return [ap_id for (ap_id,) in account_project_ids]

        if not user.account_user or not user.account_user.roles:
            return []

        active_roles = [role for role in user.account_user.roles if role.active]
        if not active_roles:
            return []

        account_project_ids = [
            role.account_project_id
            for role in active_roles
            if role.account_project_id
        ]

        return account_project_ids

    @classmethod
    def get_projects_by_proponent_id(cls, proponent_id: int):
        """Find projects by proponent_id"""
        return db.session.query(Project).filter(Project.proponent_id == proponent_id).all()

    @classmethod
    def get_account_project_by_id(cls, account_project_id: int, is_staff: bool):
        """Find account project by id."""
        # Get user type for status calculation
        user = User.get_by_guid(TokenInfo.get_username())
        user_type = user.type if user else None

        # Load account project with packages, items, and submissions for status calculation
        account_project = (
            db.session.query(AccountProject)
            .filter(AccountProject.id == account_project_id)
            .options(
                joinedload(AccountProject.packages)
                .joinedload(Package.items)
                .joinedload(Item.submissions)
            )
            .first()
        )

        # Pre-calculate statuses for all packages
        if account_project and user_type:
            for package in account_project.packages:
                package._calculated_status = PackageService.calculate_package_statuses(
                    package, user_type
                )

        schema_class = StaffAccountProjectSchema if is_staff else AccountProjectSchema
        account_project_dict = schema_class().dump(account_project)

        package_query = db.session.query(Package).join(AccountProject).filter(AccountProject.id == account_project_id)
        package_query = cls._filter_packages_by_user_access(package_query)
        filtered_package_ids = [package.id for package in package_query.all()]

        if filtered_package_ids:
            account_project_dict['packages'] = [
                package for package in account_project_dict['packages']
                if package['id'] in filtered_package_ids
            ]
        return account_project_dict

    @classmethod
    def get_filtered_package_ids(cls, search_options: AccountProjectSearchOptions, user: User = None) -> list:
        """Retrieve package IDs based on search filters."""
        package_query = cls._filter_by_search_criteria(search_options)
        package_query = cls._filter_packages_by_user_access(package_query, user)

        result = [row[0] for row in package_query.with_entities(
            Package.id).all()] if package_query else None
        return result

    @classmethod
    def _filter_account_projects_by_user_access(cls, query=None, user: User = None):
        """Filter AccountProjects by all accessible projects of the user."""
        if user is None:
            user = User.get_by_guid(TokenInfo.get_username())

        if not user:
            raise ValueError("User not found.")

        if user.type == UserType.STAFF:
            return query

        if not user.account_user or not user.account_user.role:
            # No access if no role
            return query.filter(False)

        accessible_project_ids = cls.get_accessible_account_project_ids_for_user(user)

        if query is None:
            query = db.session.query(AccountProject)

        # Filter projects by accessible project ids
        query = query.filter(AccountProject.id.in_(accessible_project_ids))

        return query

    @classmethod
    def get_paginated_account_project_ids(cls, page: int, page_size: int,
                                          filtered_package_ids: list = None, user: User = None) -> tuple:
        """Retrieve paginated AccountProject IDs based on filtering."""
        query = db.session.query(AccountProject).join(Project)

        if user is not None:
            query = cls._filter_account_projects_by_user_access(query, user)

        if filtered_package_ids is None or len(filtered_package_ids) == 0:
            account_project_ids_subquery = query.with_entities(AccountProject.id).distinct()
        else:
            account_project_ids_subquery = (query.join(Package).filter(Package.id.in_(filtered_package_ids))
                                            .with_entities(AccountProject.id).distinct())

        account_project_ids_query = (
            db.session.query(AccountProject.id)
            .join(Project)
            .filter(AccountProject.id.in_(account_project_ids_subquery))
            .order_by(Project.name)
        )

        if page and page_size:
            paginated_result = account_project_ids_query.paginate(page=page, per_page=page_size)
            return [row[0] for row in paginated_result.items], paginated_result.total

        return ([row[0] for row in account_project_ids_query.all()],
                account_project_ids_query.count())

    @classmethod
    def get_full_account_projects(cls, account_project_ids: list,
                                  is_proponent: bool, filtered_package_ids: list) -> list:
        """Retrieve full AccountProject objects, apply schema, and filter packages."""
        # Get user type for status calculation
        user = User.get_by_guid(TokenInfo.get_username())
        user_type = user.type if user else None

        # Load account projects with packages, items, and submissions for status calculation
        account_projects = (
            db.session.query(AccountProject)
            .join(Project, AccountProject.project_id == Project.id)
            .filter(AccountProject.id.in_(account_project_ids))
            .options(
                joinedload(AccountProject.packages)
                .joinedload(Package.items)
                .joinedload(Item.submissions)
            )
            .order_by(Project.name)
        ).all()

        # Pre-calculate statuses for all packages
        package_statuses = {}
        for account_project in account_projects:
            for package in account_project.packages:
                if user_type:
                    package_statuses[package.id] = PackageService.calculate_package_statuses(
                        package, user_type
                    )

        # Store calculated statuses on package objects for schema access
        for account_project in account_projects:
            for package in account_project.packages:
                if package.id in package_statuses:
                    package._calculated_status = package_statuses[package.id]

        schema_class = AccountProjectSchema if is_proponent else StaffAccountProjectSchema
        account_projects_list = schema_class(many=True).dump(account_projects)

        if filtered_package_ids:
            for account_project in account_projects_list:
                account_project['packages'] = [package for package in account_project['packages']
                                               if package['id'] in filtered_package_ids]

        return account_projects_list

    @classmethod
    def get_filtered_account_projects_paginated(
            cls,
            search_options: AccountProjectSearchOptions = None,
            page: int = None,
            page_size: int = None,
            is_proponent: bool = True,
            user: User = None
    ) -> tuple:
        """Main method to orchestrate filtered and paginated retrieval of AccountProjects."""
        if user is None:
            user = User.get_by_guid(TokenInfo.get_username())

        filtered_package_ids = cls.get_filtered_package_ids(search_options, user)

        account_project_ids, total = cls.get_paginated_account_project_ids(page, page_size,
                                                                           filtered_package_ids, user)

        if not account_project_ids:
            return [], 0

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
    def _filter_packages_by_user_access(cls, package_query=None, user: User = None):
        """Filter packages by all accessible packages of the user."""
        if user is None:
            user = User.get_by_guid(TokenInfo.get_username())

        if not user:
            raise ValueError("User not found.")

        if user.type == UserType.STAFF:
            return package_query

        if not user.account_user or not user.account_user.role:
            return package_query.filter(False)

        user_role = user.account_user.role

        if not user_role.active:
            return package_query.filter(False)

        if user_role.role.role_name in [RoleEnum.SUBMISSION_ADMIN.value, RoleEnum.PROJECT_ADMIN.value]:
            return package_query

        if not package_query:
            package_query = db.session.query(Package)

        if user_role.original_package_ids:
            package_query = package_query.join(PackageVersion).filter(
                PackageVersion.original_package_id.in_(user_role.original_package_ids))

        return package_query

    @classmethod
    def _filter_by_search_text(cls, query, search_text):
        """Filter by search text across package and project name."""
        return query.filter(
            or_(
                Package.name.ilike(f"%{search_text}%"),
                Project.name.ilike(f"%{search_text}%"),
            )
        )

    @classmethod
    def _filter_by_submission_status(cls, query, statuses):
        """Filter by submission status with revision and update handling."""
        revision_required_value = PackageStatus.REVISION_REQUIRED.value
        revision_requested_value = NonCanonicalPackageStatus.REVISION_REQUESTED.value
        update_requested_value = NonCanonicalPackageStatus.UPDATE_REQUESTED.value
        updated_value = NonCanonicalPackageStatus.UPDATED.value

        canonical_statuses = [
            PackageStatus.SUBMITTED.value if status.value == PackageStatus.NEW_SUBMISSION.value
            else status.value
            for status in statuses
            if isinstance(status, PackageStatus) and status.value != revision_required_value
            and status.value != revision_requested_value
        ]

        include_revision_required = any(
            status.value in (revision_required_value, revision_requested_value)
            for status in statuses
        )
        include_update_requested = any(
            status.value == update_requested_value for status in statuses)
        include_updated = any(
            status.value == updated_value for status in statuses)

        if canonical_statuses:
            query = query.filter(Package.status.op("&&")(canonical_statuses))

        if include_revision_required:
            query = cls._revision_required_filter(query)

        if include_update_requested or include_updated:
            query = cls._update_status_filter(
                query, include_update_requested, include_updated)

        return query

    @classmethod
    def _revision_required_filter(cls, query):
        """Filter packages requiring revision."""
        review_request = aliased(UpdateRequest)
        return query.join(
            review_request, review_request.submission_package_id == Package.id
        ).filter(
            review_request.type == UpdateRequestType.REVIEW.value,
            review_request.active.is_(True),
            ~Package.status.op("@>")([
                PackageStatus.COMPLETED.value,
                PackageStatus.PARTIALLY_COMPLETED.value,
            ])
        )

    @classmethod
    def _update_status_filter(cls, query, include_update_requested, include_updated):
        """Filter packages with update requests."""
        update_request = aliased(UpdateRequest)
        conditions = [
            update_request.type == UpdateRequestType.UPDATE.value,
            update_request.active.is_(True),
        ]

        if include_updated:
            conditions.append(update_request.status ==
                              UpdateRequestStatus.PENDING_REVIEW.value)

        if include_update_requested:
            conditions.append(update_request.status !=
                              UpdateRequestStatus.ACCEPTED.value)

        return query.join(update_request, update_request.submission_package_id == Package.id).filter(*conditions)

    @classmethod
    def _filter_by_submission_dates(cls, query, submitted_on_start, submitted_on_end):
        """Filter by submission date range."""
        if submitted_on_start:
            query = query.filter(Package.submitted_on >= submitted_on_start)
        if submitted_on_end:
            query = query.filter(Package.submitted_on <= submitted_on_end)
        return query
