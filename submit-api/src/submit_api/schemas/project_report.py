"""Project report schema.

Serializes a synced report obligation (ProjectReport) nested on a package.
"""

from marshmallow import EXCLUDE, Schema, fields


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
