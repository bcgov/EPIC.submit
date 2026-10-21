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
"""Service to sync approved report obligations into submission packages."""
from flask import current_app

from submit_api.exceptions import ResourceNotFoundError
from submit_api.models.account_project import AccountProject as AccountProjectModel
from submit_api.models.db import session_scope
from submit_api.models.package import Package as PackageModel
from submit_api.models.project import Project as ProjectModel
from submit_api.models.project_report import ProjectReport as ProjectReportModel
from submit_api.models.submission import SubmissionType
from submit_api.services.condition_api_client import ConditionApiClient
from submit_api.services.package_service import PackageService


# Report type whose display name falls back to its sub-type.
PROJECT_STATUS_NOTIFICATION = "Project Status Notification"


def _compute_display_name(report_title, report_type, report_sub_type):
    """Return the display name for a report obligation row.

    Use the report title when present; otherwise the report type; otherwise,
    for a Project Status Notification, its sub-type.
    """
    if report_title:
        return report_title
    if report_type == PROJECT_STATUS_NOTIFICATION and report_sub_type:
        return report_sub_type
    return report_type


def _flatten_reports(reports):
    """Flatten the grouped Condition API response into per-submission records.

    Rows without a source report id are skipped (the id is required to key the
    obligation to its package).
    """
    records = []
    for report in reports or []:
        report_type = report.get("report_type")
        condition_number = report.get("condition_number")

        for submission in report.get("submissions") or []:
            # The submission id is the stable per-phase identifier (phase row id).
            submission_id = submission.get("id")
            if submission_id is None:
                current_app.logger.warning(
                    "Skipping submission without id (condition_number=%s, type=%s)",
                    condition_number, report_type,
                )
                continue

            report_title = submission.get("report_title")
            report_sub_type = submission.get("report_submission_type")
            records.append({
                "report_id": submission_id,
                "condition_number": condition_number,
                "condition_subsection": submission.get("condition_subsection"),
                "report_type": report_type,
                "report_sub_type": report_sub_type,
                "report_name": report_title,
                "phase": submission.get("phase"),
                "frequency": submission.get("frequency"),
                "timing": submission.get("timing"),
                "management_plan": submission.get("management_plan"),
                "display_name": _compute_display_name(report_title, report_type, report_sub_type),
            })
    return records


def _obligation_key(record_or_row):
    """Return the stable key identifying an obligation.

    The condition repository's submission id (stored in ``report_id``) uniquely
    identifies a report phase row. Accepts a flattened record dict or a
    ProjectReport row.
    """
    if isinstance(record_or_row, dict):
        return record_or_row["report_id"]
    return record_or_row.report_id


# Fields refreshed from the source when an existing obligation is updated in place.
_UPDATABLE_FIELDS = (
    "condition_number",
    "condition_subsection",
    "report_type",
    "report_sub_type",
    "report_name",
    "phase",
    "frequency",
    "timing",
    "management_plan",
    "display_name",
)


class ReportPackageSyncService:
    """Reconcile a project's approved report obligations and their packages."""

    @classmethod
    def reconcile_project(cls, project_id: int) -> dict:
        """Reconcile report obligations and packages for a single project.

        Fetches the project's approved reports from the Condition API, inserts any
        new obligations (each with an empty Report package), updates existing
        obligations in place, and removes obligations that are no longer returned
        when their package has no uploaded documents.

        Obligations are keyed on the condition repository's submission id. Updating
        an existing obligation refreshes its fields only; the linked package and its
        documents are left untouched.

        Returns a summary dict: {added, updated, created_packages, removed, kept}.
        """
        project = ProjectModel.find_by_id(project_id)
        if not project:
            raise ResourceNotFoundError(f"Project {project_id} not found.")
        if not project.epic_guid:
            raise ResourceNotFoundError(f"Project {project_id} has no epic_guid.")

        account_project = AccountProjectModel.get_by_project_id(project_id)
        if not account_project:
            raise ResourceNotFoundError(
                f"Project {project_id} has no account project; nothing to sync."
            )

        # A Condition API failure propagates out of here before any DB change,
        # leaving all previously stored obligations untouched.
        reports = ConditionApiClient.get_approved_reports_by_project(project.epic_guid)
        records = _flatten_reports(reports)

        summary = {"added": 0, "updated": 0, "created_packages": 0, "removed": 0, "kept": 0}

        with session_scope() as session:
            existing_by_key = {
                _obligation_key(r): r
                for r in ProjectReportModel.get_by_project_id(project_id)
            }
            incoming_keys = cls._upsert_obligations(
                session, (project_id, account_project.id), records, existing_by_key, summary
            )
            cls._remove_stale_obligations(session, existing_by_key, incoming_keys, summary)

        current_app.logger.info(
            "Report package sync for project %s: added=%d updated=%d created_packages=%d "
            "removed=%d kept=%d",
            project_id, summary["added"], summary["updated"], summary["created_packages"],
            summary["removed"], summary["kept"],
        )
        return summary

    @staticmethod
    def _upsert_obligations(session, project_ids, records, existing_by_key, summary) -> set:
        """Insert new obligations (with a package) and update existing ones in place.

        Matches obligations on the condition repository submission id. Returns the
        set of incoming obligation keys seen across all records.

        project_ids is a (project_id, account_project_id) tuple.
        """
        project_id, account_project_id = project_ids
        incoming_keys = set()
        for record in records:
            key = _obligation_key(record)
            incoming_keys.add(key)

            existing = existing_by_key.get(key)
            if existing:
                # Refresh fields only; the linked package/documents are untouched.
                for field in _UPDATABLE_FIELDS:
                    setattr(existing, field, record[field])
                summary["updated"] += 1
                continue

            obligation = ProjectReportModel(project_id=project_id, **record)
            session.add(obligation)
            session.flush()
            summary["added"] += 1

            PackageService.create_report_package(
                session,
                account_project_id=account_project_id,
                project_report_id=obligation.id,
                name=record["display_name"] or record["report_type"] or "Report",
            )
            summary["created_packages"] += 1
        return incoming_keys

    @classmethod
    def _remove_stale_obligations(cls, session, existing_by_key, incoming_keys, summary) -> None:
        """Remove obligations no longer returned whose package has no documents."""
        for key, row in existing_by_key.items():
            if key in incoming_keys:
                continue
            if cls._remove_obligation_if_pristine(session, row):
                summary["removed"] += 1
            else:
                summary["kept"] += 1

    @staticmethod
    def _remove_obligation_if_pristine(session, obligation) -> bool:
        """Delete an obligation and its package only if the package has no documents.

        Returns True if the obligation (and package) were removed, False if kept.
        """
        package = PackageModel.get_by_project_report_id(obligation.id)

        if package and ReportPackageSyncService._package_has_documents(package):
            return False

        if package:
            session.delete(package)
        session.delete(obligation)
        return True

    @staticmethod
    def _package_has_documents(package) -> bool:
        """Return True if the package has at least one live document submission."""
        for item in package.items:
            for submission in item.submissions:
                if submission.type == SubmissionType.DOCUMENT:
                    return True
        return False
