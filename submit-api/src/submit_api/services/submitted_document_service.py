"""Service for submitted document management."""

from submit_api.models.account_project_search_options import DocumentSearchOptions, ProjectDocumentSearchOptions
from submit_api.models.queries.submitted_document import DocumentQueries


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
    def get_project_documents_paginated(cls, search_options: ProjectDocumentSearchOptions):
        """Get paginated documents for a project."""
        return DocumentQueries.get_project_documents_paginated(search_options)

