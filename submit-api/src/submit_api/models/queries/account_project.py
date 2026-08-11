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
from sqlalchemy.orm import joinedload
from submit_api.auth import jwt
from submit_api.enums.role import RoleEnum
from submit_api.utils.roles import EpicSubmitRole
from submit_api.models import AccountProject, Project, db, User
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.package import Package
from submit_api.models.item import Item
from submit_api.models.staff_user_work import StaffUserWork
from submit_api.models.user import UserType
from submit_api.schemas.project import AccountProjectSchema, StaffAccountProjectSchema
from submit_api.utils.token_info import TokenInfo
from submit_api.services.package_service import PackageService
from submit_api.utils.constants import MP_VIEW_PACKAGE_TYPES

BATCH_SIZE = 50        # Projects fetched per DB query in staff visible computation
MAX_BATCHES = 20       # Safety limit to prevent infinite loops


class ProjectQueries:
    """Query module for complex projects queries"""

    @classmethod
    def get_accessible_account_project_ids_for_user(cls, user):
        """Return all account_project_ids accessible by the user based on their roles."""
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

        account_project_dict = cls._filter_packages_by_user_access([account_project_dict])
        account_project_dict = account_project_dict[0]

        # Filter account_project_works for staff users without full_access role
        if is_staff and user and user.type == UserType.STAFF:
            if not jwt.contains_role([EpicSubmitRole.FULL_ACCESS.value]):
                has_gis_extended_edit = jwt.contains_role([EpicSubmitRole.GIS_EXTENDED_EDIT.value])
                accessible_work_ids = cls._get_accessible_work_ids_for_staff_user(user)
                if 'account_project_works' in account_project_dict:
                    account_project_dict['account_project_works'] = [
                        work for work in account_project_dict['account_project_works']
                        if work.get('work_id') in accessible_work_ids or has_gis_extended_edit
                    ]

        return account_project_dict

    @classmethod
    def get_full_account_projects(cls, is_proponent: bool, account_projects: list) -> list:
        """Retrieve full AccountProject objects, apply schema, and filter packages."""
        # Get user type for status calculation
        user = User.get_by_guid(TokenInfo.get_username())
        user_type = user.type if user else None

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

        # Staff path: pre-compute full visible list, then slice for requested page
        if not is_proponent and page and page_size:
            # Non-FULL_ACCESS staff: pre-compute visible projects, then slice
            visible_projects = cls._get_staff_visible_projects(
                search_options, is_proponent, user
            )
            total = len(visible_projects)
            start = (page - 1) * page_size
            end = start + page_size
            page_projects = visible_projects[start:end]
            return page_projects, total

        # Proponent path: existing behavior (unchanged)
        account_project_query = cls._filter_by_search_criteria(search_options)
        ordered_query = (
            account_project_query
            .add_columns(Project.name)
            .order_by(Project.name)
            .distinct()
        )

        if page and page_size:
            paginated_result = ordered_query.paginate(page=page, per_page=page_size)
            account_projects = [ap for ap, _ in paginated_result.items]
            total = paginated_result.total
        else:
            results = ordered_query.all()
            account_projects = [ap for ap, _ in results]
            total = len(account_projects)

        account_projects_list = cls.get_full_account_projects(is_proponent, account_projects)
        account_projects_list = cls._filter_packages_by_user_access(account_projects_list, user)

        # Status is filtered on calculated/display status, not the raw
        # DB column, so the SQL query intentionally skips the status filter here.
        if search_options and search_options.status:
            account_projects_list = cls._filter_packages_by_computed_status(
                account_projects_list, search_options.status
            )
            # Recompute total post-filter
            total = len(account_projects_list)

        return account_projects_list, total

    @classmethod
    def _get_staff_visible_projects(
        cls,
        search_options: AccountProjectSearchOptions,
        is_proponent: bool,
        user: User
    ) -> list:
        """Fetch ALL matching projects in batches, filter packages, keep visible ones."""
        visible_projects = []
        offset = 0
        batches_executed = 0

        while batches_executed < MAX_BATCHES:
            batches_executed += 1

            # Fetch a batch from the database
            query = cls._filter_by_search_criteria(search_options)
            ordered_query = (
                query
                .add_columns(Project.name)
                .order_by(Project.name)
                .distinct()
            )
            batch_results = ordered_query.offset(offset).limit(BATCH_SIZE).all()
            batch_projects = [ap for ap, _ in batch_results]

            if not batch_projects:
                break  # No more projects in DB

            # Serialize and filter packages by user access
            projects_list = cls.get_full_account_projects(is_proponent, batch_projects)
            projects_list = cls._filter_packages_by_user_access(projects_list, user)

            if search_options and search_options.status:
                projects_list = cls._filter_packages_by_computed_status(
                    projects_list, search_options.status
                )

            # Keep only projects with at least one visible package
            visible = [p for p in projects_list if p.get("packages")]
            visible_projects.extend(visible)

            # If batch was smaller than BATCH_SIZE, DB is exhausted
            if len(batch_results) < BATCH_SIZE:
                break

            offset += BATCH_SIZE

        return visible_projects

    @classmethod
    def _filter_by_search_criteria(cls, search_options: AccountProjectSearchOptions):
        """Apply various filters based on search options."""
        query = db.session.query(AccountProject).outerjoin(Package).join(Project)
        if not search_options or not any(bool(search_option) for search_option in search_options.__dict__.values()):
            return query

        if search_options.search_text:
            query = cls._filter_by_search_text(
                query, search_options.search_text)
        if search_options.submitted_on_start or search_options.submitted_on_end:
            query = cls._filter_by_submission_dates(
                query, search_options.submitted_on_start, search_options.submitted_on_end
            )

        return query

    @classmethod
    def _get_accessible_work_ids_for_staff_user(cls, user: User):
        """Get list of work IDs accessible to a staff user."""
        if not user or user.type != UserType.STAFF:
            return []

        staff_user = user.staff_user
        if not staff_user:
            return []
        if not jwt.contains_role([EpicSubmitRole.W_VIEW.value]):
            return []

        # Get all active work IDs for this staff user
        work_ids = db.session.query(StaffUserWork.work_id).filter(
            StaffUserWork.staff_user_id == staff_user.id,
            StaffUserWork.is_active == True  # noqa: E712
        ).all()

        return [work_id for (work_id,) in work_ids]

    @classmethod
    def _filter_packages_by_user_access(cls, account_project_list=None, user: User = None):
        """Filter packages by all accessible packages of the user."""
        if user is None:
            user = User.get_by_guid(TokenInfo.get_username())

        if not user:
            raise ValueError("User not found.")
        if user.type == UserType.STAFF:
            # Users with full_access role have access to all packages
            if jwt.contains_role([EpicSubmitRole.FULL_ACCESS.value]):
                return account_project_list

            # Filter packages based on staff user's work assignments and permissions
            staff_user = user.staff_user
            if not staff_user:
                return []
            accessible_work_ids = cls._get_accessible_work_ids_for_staff_user(user)
            # Check if user has w_view permission for works
            has_w_view = jwt.contains_role([EpicSubmitRole.W_VIEW.value])

            # Check if user has gis_extended_edit permission
            has_gis_extended_edit = jwt.contains_role([EpicSubmitRole.GIS_EXTENDED_EDIT.value])

            # Check if user has mp_view permission for management plans
            has_mp_view = jwt.contains_role([EpicSubmitRole.MP_VIEW.value])

            # Build filter conditions based on permissions
            for account_project in account_project_list:
                allowed_packages = []
                packages = account_project["packages"]
                work_related_packages = [
                    package for package in packages
                    if package.get("account_project_work_id") is not None
                ]
                management_plan_related_packages = [
                    package for package in packages
                    if package.get("type").get("name") in MP_VIEW_PACKAGE_TYPES
                ]
                # GIS_EXTENDED_EDIT users can access all work related packages
                if has_gis_extended_edit:
                    allowed_packages.extend(work_related_packages)
                # W_VIEW users can access work related packages for works they are assigned to
                if has_w_view and not has_gis_extended_edit:
                    staff_user_works = StaffUserWork.find_by_staff_user_id(staff_user.id)
                    work_ids = [
                        staff_user_work.work_id for staff_user_work in staff_user_works
                    ]
                    allowed_packages.extend([
                        package for package in work_related_packages
                        if package.get("account_project_work").get("work_id") in work_ids
                    ])
                # MP_VIEW users can access management plan related packages
                if has_mp_view:
                    allowed_packages.extend(management_plan_related_packages)
                account_project["packages"] = allowed_packages
                # Set the correct account_project_works
                # Skip the accesible work ids check if there is gis permission
                if 'account_project_works' in account_project:
                    account_project['account_project_works'] = [
                        work for work in account_project['account_project_works']
                        if work.get('work_id') in accessible_work_ids or has_gis_extended_edit
                    ]
        if user.type == UserType.PROPONENT:
            if not user.account_user or not user.account_user.roles:
                return []

            active_roles = user.account_user.roles
            if not active_roles:
                return []

            accessible_project_ids = cls.get_accessible_account_project_ids_for_user(user)
            if len(accessible_project_ids) == 0:
                return []
            account_project_list = [
                account_project for account_project in account_project_list
                if account_project.get("id") in accessible_project_ids
            ]

            # If any role grants full project access, return all packages
            full_access_roles = [
                RoleEnum.SUBMISSION_ADMIN.value,
                RoleEnum.PROJECT_ADMIN.value,
                RoleEnum.ACCOUNT_PRIMARY_ADMIN.value
            ]
            if any(r.role.role_name in full_access_roles for r in active_roles):
                return account_project_list

            # Build a mapping of account_project_id -> allowed original_package_ids
            project_allowed_packages = {}
            for role in active_roles:
                if role.original_package_ids and role.account_project_id:
                    project_allowed_packages.setdefault(role.account_project_id, set()).update(
                        role.original_package_ids
                    )

            if project_allowed_packages:
                for account_project in account_project_list:
                    allowed_ids = project_allowed_packages.get(account_project.get("id"), set())
                    account_project["packages"] = [
                        package for package in account_project.get("packages")
                        if package.get("version").get("original_package_id") in allowed_ids
                    ]
            else:
                account_project_list = []
        # return account_project_query
        return account_project_list

    @classmethod
    def _filter_packages_by_computed_status(cls, account_project_list, requested_statuses):
        """Trim projects/packages down to those matching the calculated (display) status."""
        if not requested_statuses:
            return account_project_list

        requested_values = {status.value for status in requested_statuses}

        filtered_projects = []
        for account_project in account_project_list:
            matching_packages = [
                package for package in account_project.get("packages", [])
                if requested_values.intersection(package.get("status") or [])
            ]
            if matching_packages:
                filtered_projects.append({**account_project, "packages": matching_packages})

        return filtered_projects

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
    def _filter_by_submission_dates(cls, query, submitted_on_start, submitted_on_end):
        """Filter by submission date range."""
        if submitted_on_start:
            query = query.filter(Package.submitted_on >= submitted_on_start)
        if submitted_on_end:
            query = query.filter(Package.submitted_on <= submitted_on_end)
        return query
