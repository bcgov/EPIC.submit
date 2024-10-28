"""Module for handling complex queries related to projects."""

from submit_api.models import AccountProject, Project, db
from submit_api.models.account_project_search_options import AccountProjectSearchOptions
from submit_api.models.package import Package, PackageStatus


class ProjectQueries:
    """Handles queries related to projects and packages with complex filtering criteria."""

    @classmethod
    def get_projects_by_account_id(
        cls, account_id: int, search_options: AccountProjectSearchOptions
    ):
        """Retrieve projects by account_id, filtering packages based on search options."""
        with db.session.no_autoflush:
            # Base query to filter projects by account ID
            query = (
                db.session.query(AccountProject)
                .filter(AccountProject.account_id == account_id)
                .join(Project)
            )

            projects = query.all()

            # Filter packages within each project based on criteria
            for project in projects:
                project.packages = [
                    package
                    for package in project.packages
                    if cls._package_matches_criteria(package, search_options)
                ]

            # Return only projects with matching packages
            return [project for project in projects if project.packages]

    @classmethod
    def get_projects_by_proponent_id(cls, proponent_id: int):
        """Retrieve projects by proponent_id."""
        return (
            db.session.query(Project).filter(Project.proponent_id == proponent_id).all()
        )

    @classmethod
    def _package_matches_criteria(cls, package, search_options):
        """Evaluate if a package matches search criteria."""
        # Text filtering
        if (
            search_options.search_text
            and search_options.search_text.lower() not in package.name.lower()
        ):
            return False

        # Status filtering - requires package to have all statuses in search options
        if search_options.status:
            search_statuses = {
                status.value if isinstance(status, PackageStatus) else status
                for status in search_options.status
            }
            package_statuses = {status.value for status in package.status}
            if not search_statuses.issubset(
                package_statuses
            ):  # Check all selected statuses are in package status
                return False

        # Date range filtering
        if search_options.submitted_on_start and (
            package.submitted_on is None
            or package.submitted_on < search_options.submitted_on_start
        ):
            return False
        if search_options.submitted_on_end and (
            package.submitted_on is None
            or package.submitted_on > search_options.submitted_on_end
        ):
            return False

        return True

    @classmethod
    def filter_by_search_criteria(cls, query, search_options):
        """Apply multiple search criteria to a query."""
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
        """Filter by package name containing search text."""
        if search_text:
            return query.filter(Package.name.ilike(f"%{search_text}%"))
        return query

    @classmethod
    def _filter_by_submission_status(cls, query, statuses):
        """Filter by overlapping statuses in the package status array."""
        if statuses:
            status_values = [status.value for status in statuses]
            if status_values:
                return query.filter(Package.status.op("&&")(status_values))
        return query

    @classmethod
    def _filter_by_submission_dates(cls, query, submitted_on_start, submitted_on_end):
        """Filter by submission date range."""
        if submitted_on_start:
            query = query.filter(Package.submitted_on >= submitted_on_start)
        if submitted_on_end:
            query = query.filter(Package.submitted_on <= submitted_on_end)
        return query
