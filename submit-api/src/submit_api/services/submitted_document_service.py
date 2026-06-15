"""Service for submitted document management."""

from submit_api.models.account_project import AccountProject
from submit_api.models.account_project_search_options import DocumentSearchOptions, ProjectDocumentSearchOptions
from submit_api.models.queries.submitted_document import DocumentQueries
from submit_api.services import authorization


class DocumentService:
    """Submitted document management service."""

    @classmethod
    def get_all_documents(cls, search_options: DocumentSearchOptions = None):
        """Get all documents."""
        return DocumentQueries.get_filtered_documents(search_options)

    @classmethod
    def get_failed_documents_by_item_id(cls, item_id):
        """Get all failed documents by item id."""
        return DocumentQueries.get_failed_documents_by_item_id(item_id)

    @classmethod
    def get_submissions_by_package_id(cls, package_id):
        """Get all failed documents by package id."""
        return DocumentQueries.get_document_submissions_by_package_id(package_id)

    @classmethod
    def get_documents_paginated(cls, search_options: ProjectDocumentSearchOptions):
        """Get paginated documents (global or project-specific)."""
        if not search_options.is_staff:
            account_project = AccountProject.get_by_project_id(search_options.project_id)
            authorization.check_has_permissions_on_project(account_project_ids=[account_project.id])
        return DocumentQueries.get_documents_paginated(search_options)

    @classmethod
    def get_project_documents_paginated(cls, search_options: ProjectDocumentSearchOptions):
        """Get paginated documents for a project (LEGACY)."""
        return cls.get_documents_paginated(search_options)
