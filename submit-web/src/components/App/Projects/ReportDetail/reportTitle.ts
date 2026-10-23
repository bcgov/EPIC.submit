import { ProjectReport } from "@/models/Package";

/**
 * Formats the report page/breadcrumb title as "[Report name]: [Phase]"
 * (e.g. "Compliance Self-Report: Construction"). Falls back gracefully when
 * either part is missing.
 */
export const formatReportPageTitle = (report?: ProjectReport | null): string => {
  if (!report) {
    return "";
  }
  const name = report.display_name || report.report_type || report.report_name || "";
  const phase = report.phase || "";
  if (name && phase) {
    return `${name}: ${phase}`;
  }
  return name || phase;
};
