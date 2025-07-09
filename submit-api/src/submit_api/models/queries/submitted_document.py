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
"""Model to handle all complex operations related to Submitted Documents."""

from sqlalchemy import cast, or_, String
from submit_api.models.account_project import AccountProject
from submit_api.models.account_project_search_options import DocumentSearchOptions
from submit_api.models.db import db
from submit_api.models.item import Item
from submit_api.models.package import Package
from submit_api.models.project import Project
from submit_api.models.submission import Submission, SubmissionType, SubmissionStatus
from submit_api.models.submitted_document import SubmittedDocument


class DocumentQueries:
    """Query module for complex document queries."""

    @classmethod
    def get_filtered_documents(cls, search_options: DocumentSearchOptions = None):
        """Get all documents."""
        session = db.session

        query = session.query(
            Project.name.label("project_name"),
            SubmittedDocument.id,
            SubmittedDocument.name,
            SubmittedDocument.url,
            Item.status,
            # TODO once document version is captured this logic needs to be revisited
            (cast(Submission.major_version, String) + "." +
             cast(Submission.minor_version, String)).label("version"),
            Package.submitted_on
        )

        # Apply joins step by step
        query = query.join(AccountProject, AccountProject.project_id == Project.id)
        query = query.join(
            Package, Package.account_project_id == AccountProject.id)
        query = query.join(Item, Item.package_id == Package.id)
        query = query.join(Submission, Submission.item_id == Item.id)
        query = query.join(
            SubmittedDocument, SubmittedDocument.id == Submission.submitted_document_id)

        # Apply filtering conditions
        query = query.filter(Submission.type == SubmissionType.DOCUMENT)

        # Apply search filters if provided
        if search_options and any(bool(search_option) for search_option in search_options.__dict__.values()):
            query = cls.filter_by_search_criteria(query, search_options)

        return query.all()

    @classmethod
    def filter_by_search_criteria(cls, query, search_options: DocumentSearchOptions):
        """Apply various filters based on search options."""
        if search_options.search_text:
            query = cls._filter_by_search_text(query, search_options.search_text)
        return query

    @classmethod
    def _filter_by_search_text(cls, query, search_text):
        """Filter by search text across package name."""
        return query.filter(
            or_(
                Package.name.ilike(f"%{search_text}%"),
                Project.name.ilike(f"%{search_text}%")
            )
        )

    @classmethod
    def get_failed_documents_by_item_id(cls, item_id):
        """Get all failed documents by item id."""
        session = db.session

        query = session.query(Submission).filter_by(
            item_id=item_id,
            type=SubmissionType.DOCUMENT,
            status=SubmissionStatus.REJECTED,
            active=True,
            deleted=False
        )

        return query.all()

    @classmethod
    def get_document_submissions_by_package_id(cls, package_id):
        """Get all failed documents by item id."""
        session = db.session

        query = (session.query(Submission)
                 .join(Item, Item.id == Submission.item_id)
                 .join(Package, Package.id == Item.package_id)
                 .filter(Package.id == package_id,
                         Submission.type == SubmissionType.DOCUMENT,
                         Submission.active.is_(True),
                         Submission.deleted.is_(False),
                         Submission.status != SubmissionStatus.PENDING))

        return query.all()
