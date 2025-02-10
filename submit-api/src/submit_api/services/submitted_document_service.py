"""Service for submitted document management."""

from submit_api.models.account_project_search_options import DocumentSearchOptions
from submit_api.models.queries.submitted_document import DocumentQueries


class DocumentService:
    """Submitted document management service."""

    @classmethod
    def get_all_documents(cls, search_options: DocumentSearchOptions = None):
        """Get all documents."""
        return DocumentQueries.get_filtered_documents(search_options)
