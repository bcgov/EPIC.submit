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

from sqlalchemy import cast, and_, case, false, or_, String, func
from submit_api.models.account_project import AccountProject
from submit_api.models.account_project_search_options import DocumentSearchOptions, ProjectDocumentSearchOptions
from submit_api.models.db import db
from submit_api.models.item import Item
from submit_api.models.non_work_package_map import NonWorkPackageMap
from submit_api.models.package import Package
from submit_api.models.package_type import PackageType
from submit_api.models.queries.submitted_date import filter_by_submitted_date
from submit_api.models.project import Project
from submit_api.models.submission import Submission, SubmissionType, SubmissionStatus
from submit_api.models.submitted_document import SubmittedDocument
from submit_api.models.account_project_work import AccountProjectWork
from submit_api.models.track_work import TrackWork
from submit_api.models.track_phase import TrackPhase


# Prefixes of the Work/Phase filter option keys sent by the Documents page
WORK_PHASE_KEY_WORK = "work"
WORK_PHASE_KEY_NON_WORK = "non_work"


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

    @classmethod
    def get_documents_paginated(cls, search_options: ProjectDocumentSearchOptions):
        """Get paginated documents (global or project-specific).

        Deduplicates by root_submission_id so only the latest version of each
        document lineage appears in the listing. Previous versions are accessible
        via the /submissions/{id}/versions endpoint.
        """
        session = db.session

        # Subquery: for each root_submission_id, find the max version
        # (major_version * 1000 + minor_version gives a single sortable integer)
        latest_version_subquery = (
            session.query(
                Submission.root_submission_id,
                func.max(
                    Submission.major_version * 1000 + Submission.minor_version
                ).label("max_version_rank")
            )
            .filter(
                Submission.type == SubmissionType.DOCUMENT,
                Submission.active.is_(True),
                Submission.deleted.is_(False),
                or_(Submission.status != SubmissionStatus.PENDING, Submission.status.is_(None))
            )
            .group_by(Submission.root_submission_id)
            .subquery("latest_versions")
        )

        # Work-based packages take their labels from the work; packages without a work take them
        # from the non-work package map their package type is linked to (e.g. Management Plan).
        is_work_package = Package.account_project_work_id.isnot(None)
        work_label = case(
            (is_work_package, TrackWork.title),
            else_=NonWorkPackageMap.work_label,
        )
        phase_label = case(
            (is_work_package, func.coalesce(TrackPhase.display_name, TrackPhase.name)),
            else_=NonWorkPackageMap.phase_label,
        )

        query = session.query(
            SubmittedDocument.id.label("id"),
            SubmittedDocument.name.label("name"),
            SubmittedDocument.url.label("url"),
            SubmittedDocument.virus_scan_result,
            Project.name.label("project_name"),
            work_label.label("work"),
            phase_label.label("phase"),
            Submission.major_version,
            Submission.minor_version,
            Package.submitted_on,
            Item.status,
            Submission.root_submission_id,
        )

        query = query.join(Item, Item.id == Submission.item_id)
        query = query.join(Package, Package.id == Item.package_id)
        query = query.join(AccountProject, AccountProject.id == Package.account_project_id)
        query = query.join(Project, Project.id == AccountProject.project_id)
        query = query.join(SubmittedDocument, SubmittedDocument.id == Submission.submitted_document_id)
        query = query.join(PackageType, PackageType.id == Package.type_id)

        query = query.outerjoin(AccountProjectWork, AccountProjectWork.id == Package.account_project_work_id)
        query = query.outerjoin(TrackWork, TrackWork.id == AccountProjectWork.work_id)
        query = query.outerjoin(TrackPhase, TrackPhase.id == TrackWork.current_phase_id)
        query = query.outerjoin(
            NonWorkPackageMap, NonWorkPackageMap.id == PackageType.non_work_package_map_id
        )

        # Join to the subquery to keep only the latest version per root_submission_id
        query = query.join(
            latest_version_subquery,
            and_(
                Submission.root_submission_id == latest_version_subquery.c.root_submission_id,
                (Submission.major_version * 1000 + Submission.minor_version) ==
                latest_version_subquery.c.max_version_rank
            )
        )

        query = query.filter(
            Submission.type == SubmissionType.DOCUMENT,
            Submission.active.is_(True),
            Submission.deleted.is_(False),
            or_(Submission.status != SubmissionStatus.PENDING, Submission.status.is_(None))
        )

        if search_options.project_id:
            query = query.filter(AccountProject.project_id == search_options.project_id)

        if search_options.name:
            query = query.filter(SubmittedDocument.name.ilike(f"%{search_options.name}%"))

        if search_options.submission_type:
            query = query.filter(PackageType.name.in_(search_options.submission_type))

        if search_options.status:
            query = query.filter(cast(Item.status, String).in_(search_options.status))

        if search_options.work_phase:
            query = cls._filter_by_work_phase_keys(query, search_options.work_phase)

        query = filter_by_submitted_date(query, search_options.submitted_on_start, search_options.submitted_on_end)
        query = query.order_by(Package.submitted_on.desc())

        # Pagination
        paginated_result = query.paginate(page=search_options.page, per_page=search_options.size, error_out=False)

        return paginated_result

    @staticmethod
    def _filter_by_work_phase_keys(query, work_phase_keys):
        """Filter by Work/Phase option keys.

        Keys are "work:<track_work_id>" for work-based packages and "non_work:<CODE>" for
        packages without a work (e.g. "non_work:MANAGEMENT_PLAN"). Unrecognised keys match nothing.
        """
        work_ids, non_work_codes = parse_work_phase_keys(work_phase_keys)

        conditions = []
        if work_ids:
            conditions.append(AccountProjectWork.work_id.in_(work_ids))
        if non_work_codes:
            conditions.append(
                and_(
                    Package.account_project_work_id.is_(None),
                    NonWorkPackageMap.code.in_(non_work_codes),
                )
            )
        if not conditions:
            return query.filter(false())
        return query.filter(or_(*conditions))


def parse_work_phase_keys(work_phase_keys) -> tuple[list[int], list[str]]:
    """Split Work/Phase option keys into track work ids and non-work package map codes."""
    work_ids = []
    non_work_codes = []
    for key in work_phase_keys or []:
        prefix, _, value = (key or "").partition(":")
        if prefix == WORK_PHASE_KEY_WORK and value.isdigit():
            work_ids.append(int(value))
        elif prefix == WORK_PHASE_KEY_NON_WORK and value:
            non_work_codes.append(value)
    return work_ids, non_work_codes
