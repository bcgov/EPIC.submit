"""Project report schema.

Serializes a synced report obligation (ProjectReport) nested on a package.
"""

from marshmallow import EXCLUDE, Schema, fields

from submit_api.models.project_report import ProjectReport as ProjectReportModel
from submit_api.utils.constants import REPORT_PHASE_ORDER


def _phase_sort_key(phase):
    """Return a sort key ordering phases by REPORT_PHASE_ORDER, unknowns last by name."""
    try:
        return (REPORT_PHASE_ORDER.index(phase), "")
    except ValueError:
        return (len(REPORT_PHASE_ORDER), phase or "")


class ProjectReportSchema(Schema):
    """Schema for a single synced report obligation."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    project_id = fields.Int(data_key="project_id")
    report_id = fields.Int(data_key="report_id")
    condition_number = fields.Int(data_key="condition_number", allow_none=True)
    condition_subsection = fields.Str(data_key="condition_subsection", allow_none=True)
    report_type = fields.Str(data_key="report_type", allow_none=True)
    report_sub_type = fields.Str(data_key="report_sub_type", allow_none=True)
    report_name = fields.Str(data_key="report_name", allow_none=True)
    phase = fields.Str(data_key="phase", allow_none=True)
    frequency = fields.Str(data_key="frequency", allow_none=True)
    timing = fields.Str(data_key="timing", allow_none=True)
    management_plan = fields.Str(data_key="management_plan", allow_none=True)
    display_name = fields.Str(data_key="display_name", allow_none=True)
    also_required_in_phases = fields.Method(
        "get_also_required_in_phases", data_key="also_required_in_phases")

    def get_also_required_in_phases(self, obj):
        """Return the other phases this obligation applies to, in phase order."""
        siblings = ProjectReportModel.get_sibling_phase_rows(obj)
        phases = {row.phase for row in siblings if row.phase}
        return sorted(phases, key=_phase_sort_key)
