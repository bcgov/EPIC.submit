import { PackageStatus } from "@/models/Package";

// Which project card the reports section is rendered on. Drives the submission
// name link target (staff vs regulated party report page).
export type ReportsAudience = "staff" | "proponent";

// Report statuses shown in the Status column, in priority order. The first one
// present on the package wins. "New Submission" ships with this story; the
// later terminal statuses are included so sibling stories (verified /
// acknowledged / pending acknowledgement) light up without further changes.
const REPORT_STATUS_PRIORITY: PackageStatus[] = [
  "NEW_SUBMISSION",
  "PENDING_ACKNOWLEDGEMENT",
  "ACKNOWLEDGED",
  "VERIFIED",
];

/**
 * Returns the single status to show for a report obligation, or null when
 * nothing has been submitted (rendered as a "None" placeholder). A document the
 * Regulated Party sent that has not been verified surfaces as "New Submission".
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
