import { PackageStatus } from "@/models/Package";

// Which project card the reports section is rendered on. Drives the submission
// name link target (staff vs regulated party report page).
export type ReportsAudience = "staff" | "proponent";

// Report statuses shown in the Status column, in priority order. The first one
// present on the package wins.
//
// For the Regulated Party (proponent) card the API already derives a single
// status from the newest main document (SUBMIT-1027): UPLOADED_BY_EAO,
// ACKNOWLEDGED, VERIFIED, or SUBMITTED. For the EAO/staff card the package
// carries its aggregate statuses (NEW_SUBMISSION, VERIFIED, etc.), which keep
// working off the same priority list.
const REPORT_STATUS_PRIORITY: PackageStatus[] = [
  "UPLOADED_BY_EAO",
  "NEW_SUBMISSION",
  "ACKNOWLEDGED",
  "VERIFIED",
  "SUBMITTED",
];

/**
 * Returns the single status to show for a report obligation, or null when
 * nothing has been submitted (rendered as a "None" placeholder).
 */
export const getReportStatus = (
  statuses?: PackageStatus[],
): PackageStatus | null => {
  if (!statuses?.length) {
    return null;
  }
  return (
    REPORT_STATUS_PRIORITY.find((status) => statuses.includes(status)) ?? null
  );
};
